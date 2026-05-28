/**
 * POST /api/upload-logo
 *
 * Accepts a logo image upload, saves it to disk under public/uploads/logos/,
 * and uses Claude vision to extract a brand color palette (primary,
 * secondary, accent). Returns { logoUrl, colors } that the client passes
 * into the BMC, which the design pipeline then uses to inform the palette
 * selection.
 *
 * Auth: open during the strategy phase (the customer hasn't signed up
 * yet at the time of upload). Rate-limited implicitly by upload size.
 */

import { writeFile, mkdir } from 'node:fs/promises'
import path from 'node:path'
import crypto from 'node:crypto'
import sharp from 'sharp'
import Anthropic from '@anthropic-ai/sdk'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

const ACCEPTED_TYPES = new Set(['image/png', 'image/jpeg', 'image/webp', 'image/svg+xml'])
const MAX_BYTES = 4 * 1024 * 1024 // 4MB

interface ExtractedPalette {
  primary: string
  secondary: string
  accent: string
  description: string
}

async function extractColors(imageBytes: Uint8Array, mimeType: string): Promise<ExtractedPalette | null> {
  const apiKey = process.env.ANTHROPIC_API_KEY
  if (!apiKey) return null

  // SVG goes raw; raster goes through sharp to bound dimensions for cheaper vision
  let bytes = imageBytes
  let mediaType: 'image/png' | 'image/jpeg' | 'image/webp' | 'image/gif' = 'image/png'
  if (mimeType === 'image/svg+xml') {
    // Rasterize SVG to PNG for vision (Claude doesn't accept SVG directly)
    bytes = await sharp(imageBytes).resize(400, 400, { fit: 'inside' }).png().toBuffer()
  } else {
    bytes = await sharp(imageBytes).resize(400, 400, { fit: 'inside' }).toBuffer()
    mediaType = mimeType === 'image/jpeg' ? 'image/jpeg' : mimeType === 'image/webp' ? 'image/webp' : 'image/png'
  }

  const client = new Anthropic({ apiKey })
  const response = await client.messages.create({
    model: 'claude-haiku-4-5',
    max_tokens: 256,
    messages: [
      {
        role: 'user',
        content: [
          {
            type: 'image',
            source: {
              type: 'base64',
              media_type: mediaType,
              data: Buffer.from(bytes).toString('base64'),
            },
          },
          {
            type: 'text',
            text: `Extract this logo's brand color palette. Return STRICT JSON only, no prose:
{
  "primary": "#RRGGBB",   // the dominant brand color
  "secondary": "#RRGGBB", // the next most prominent color (or a complementary neutral)
  "accent": "#RRGGBB",    // a smaller pop color for highlights, or a tertiary
  "description": "1-line mood description (e.g. 'warm earthy, sun-bleached terracotta')"
}
Rules:
- Ignore pure white and pure black backgrounds unless they are clearly intentional brand colors.
- All three values must be valid #RRGGBB hex (uppercase ok).
- If the logo is monochrome, pick a complementary secondary and a tonal accent.`,
          },
        ],
      },
    ],
  })

  const textBlock = response.content.find((b) => b.type === 'text')
  if (!textBlock || textBlock.type !== 'text') return null
  const raw = textBlock.text.trim()

  // Tolerant parse — strip any code fences the model adds
  const cleaned = raw.replace(/```json\s*|```/g, '').trim()
  const firstBrace = cleaned.indexOf('{')
  const lastBrace = cleaned.lastIndexOf('}')
  if (firstBrace === -1 || lastBrace === -1) return null

  try {
    const parsed = JSON.parse(cleaned.slice(firstBrace, lastBrace + 1)) as ExtractedPalette
    const hex = /^#[0-9a-fA-F]{6}$/
    if (!hex.test(parsed.primary) || !hex.test(parsed.secondary) || !hex.test(parsed.accent)) {
      return null
    }
    return {
      primary: parsed.primary.toUpperCase(),
      secondary: parsed.secondary.toUpperCase(),
      accent: parsed.accent.toUpperCase(),
      description: parsed.description ?? '',
    }
  } catch {
    return null
  }
}

export async function POST(req: Request) {
  let form: FormData
  try {
    form = await req.formData()
  } catch {
    return Response.json({ error: 'Expected multipart/form-data' }, { status: 400 })
  }

  const file = form.get('logo')
  if (!(file instanceof File)) {
    return Response.json({ error: 'Missing logo file' }, { status: 400 })
  }
  if (file.size > MAX_BYTES) {
    return Response.json({ error: `Logo too large (max ${MAX_BYTES / 1024 / 1024}MB)` }, { status: 413 })
  }
  if (!ACCEPTED_TYPES.has(file.type)) {
    return Response.json(
      { error: `Unsupported type ${file.type}. Use PNG, JPEG, WebP, or SVG.` },
      { status: 415 }
    )
  }

  const bytes = new Uint8Array(await file.arrayBuffer())

  // ── Save to public/uploads/logos/ ──
  const ext = file.type === 'image/svg+xml' ? 'svg'
    : file.type === 'image/jpeg' ? 'jpg'
    : file.type === 'image/webp' ? 'webp'
    : 'png'
  const hash = crypto.createHash('sha1').update(bytes).digest('hex').slice(0, 12)
  const filename = `logo-${hash}.${ext}`
  const dir = path.join(process.cwd(), 'public', 'uploads', 'logos')
  await mkdir(dir, { recursive: true })
  await writeFile(path.join(dir, filename), bytes)
  const logoUrl = `/uploads/logos/${filename}`

  // ── Extract palette (best-effort — non-fatal) ──
  let colors: ExtractedPalette | null = null
  try {
    colors = await extractColors(bytes, file.type)
  } catch (err) {
    console.warn('[upload-logo] color extraction failed:', err instanceof Error ? err.message : err)
  }

  return Response.json({ logoUrl, colors })
}
