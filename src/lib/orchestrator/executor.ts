import { getPayload } from 'payload'
import config from '@payload-config'
import type { ToolExecutionResult, PayloadToolInput } from './types'

// ── PayloadExecutor ───────────────────────────────────────────────────────────
// Translates tool call inputs (from Claude) into Payload Local API operations.

export class PayloadExecutor {
  async execute(toolName: string, input: PayloadToolInput): Promise<ToolExecutionResult> {
    try {
      const payload = await getPayload({ config })

      switch (toolName) {
        case 'get_site_overview': {
          const [pagesResult, siteSettings, header, footer] = await Promise.all([
            payload.find({ collection: 'pages', limit: 50, select: { title: true, slug: true, layout: true } }),
            payload.findGlobal({ slug: 'site-settings' }).catch(() => null),
            payload.findGlobal({ slug: 'header' }).catch(() => null),
            payload.findGlobal({ slug: 'footer' }).catch(() => null),
          ])
          return {
            success: true,
            data: {
              pages: pagesResult.docs.map(p => ({
                title: p.title,
                slug: p.slug,
                blockCount: Array.isArray(p.layout) ? p.layout.length : 0,
                blockTypes: Array.isArray(p.layout)
                  ? (p.layout as Array<{ blockType?: string }>).map(b => b.blockType)
                  : [],
              })),
              siteSettings,
              header,
              footer,
            },
          }
        }

        case 'list_pages': {
          const { docs } = await payload.find({
            collection: 'pages',
            limit: 100,
            select: { title: true, slug: true },
          })
          return { success: true, data: docs }
        }

        case 'get_page': {
          const { docs } = await payload.find({
            collection: 'pages',
            where: { slug: { equals: input.slug as string } },
            limit: 1,
          })
          if (!docs[0]) return { success: false, error: `Page "${input.slug}" not found` }
          return { success: true, data: docs[0] }
        }

        case 'create_page': {
          // Check if slug already exists
          const { docs: existing } = await payload.find({
            collection: 'pages',
            where: { slug: { equals: input.slug as string } },
            limit: 1,
          })
          if (existing[0]) {
            // Update instead of creating duplicate
            const updated = await payload.update({
              collection: 'pages',
              id: existing[0].id,
              data: {
                title: (input.title as string) || existing[0].title,
                layout: (input.blocks as object[]) ?? [],
              },
            })
            return { success: true, data: updated }
          }

          const page = await payload.create({
            collection: 'pages',
            data: {
              title: input.title as string,
              slug: input.slug as string,
              layout: (input.blocks as object[]) ?? [],
            },
          })
          return { success: true, data: { id: page.id, title: page.title, slug: page.slug } }
        }

        case 'update_page': {
          const { docs } = await payload.find({
            collection: 'pages',
            where: { slug: { equals: input.slug as string } },
            limit: 1,
          })
          if (!docs[0]) return { success: false, error: `Page "${input.slug}" not found` }

          const updateData: Record<string, unknown> = { layout: (input.blocks as object[]) ?? [] }
          if (input.title) updateData.title = input.title

          await payload.update({
            collection: 'pages',
            id: docs[0].id,
            data: updateData,
          })
          return { success: true, data: { slug: input.slug, updated: true } }
        }

        case 'update_site_settings': {
          const data: Record<string, unknown> = {}
          if (input.siteName) data.siteName = input.siteName
          if (input.siteDescription) data.siteDescription = input.siteDescription

          const updated = await payload.updateGlobal({ slug: 'site-settings', data })
          return { success: true, data: updated }
        }

        case 'update_header': {
          const data: Record<string, unknown> = {}
          if (input.logoText) data.logoText = input.logoText
          if (input.navLinks) data.navLinks = input.navLinks

          const updated = await payload.updateGlobal({ slug: 'header', data })
          return { success: true, data: updated }
        }

        case 'update_footer': {
          const data: Record<string, unknown> = {}
          if (input.copyright) data.copyright = input.copyright
          if (input.footerLinks) data.footerLinks = input.footerLinks

          const updated = await payload.updateGlobal({ slug: 'footer', data })
          return { success: true, data: updated }
        }

        default:
          return { success: false, error: `Unknown tool: ${toolName}` }
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err)
      return { success: false, error: message }
    }
  }
}
