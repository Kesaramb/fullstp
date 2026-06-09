import type { EmailAdapter, SendEmailOptions } from 'payload'
import nodemailer from 'nodemailer'
import type { Transporter } from 'nodemailer'
import { FROM, getResendClient } from './resend'

/**
 * Payload transactional-email adapter (forgot-password, verification, etc.).
 *
 * Transport selection, in priority order:
 *   1. SMTP_HOST set        → send via SMTP (the server's local Exim/HestiaCP
 *                             mail stack at 127.0.0.1:25, which DKIM-signs
 *                             outbound mail for fullstp.com).
 *   2. RESEND_API_KEY set   → send via Resend (hosted ESP).
 *   3. neither              → log a warning and no-op (dev/build safe).
 *
 * From address comes from MAIL_FROM, else the shared FROM default.
 */

function fromAddress(message: SendEmailOptions): string {
  if (typeof message.from === 'string' && message.from.trim()) return message.from
  return process.env.MAIL_FROM || FROM
}

/** Normalise nodemailer's flexible `to`/`address` shapes into plain strings. */
function toAddresses(to: SendEmailOptions['to']): string[] {
  if (!to) return []
  const list = Array.isArray(to) ? to : [to]
  return list
    .map((entry) => (typeof entry === 'string' ? entry : entry?.address))
    .filter((addr): addr is string => Boolean(addr))
}

// Reuse one SMTP transporter across sends (connection pooling).
let cachedTransport: Transporter | null = null
function getSmtpTransport(): Transporter | null {
  const host = process.env.SMTP_HOST
  if (!host) return null
  if (cachedTransport) return cachedTransport
  const port = Number(process.env.SMTP_PORT) || 25
  const user = process.env.SMTP_USER
  const pass = process.env.SMTP_PASS
  cachedTransport = nodemailer.createTransport({
    host,
    port,
    // 465 = implicit TLS; 25/587 = plain/STARTTLS. Localhost relay needs no TLS.
    secure: port === 465,
    ...(user && pass ? { auth: { user, pass } } : {}),
    // Local relay uses a self-signed/hostname-mismatched cert; don't fail on it.
    tls: { rejectUnauthorized: false },
  })
  return cachedTransport
}

export const resendEmailAdapter: EmailAdapter = () => ({
  name: 'fullstp-mail',
  defaultFromAddress: process.env.MAIL_FROM?.match(/<(.+)>/)?.[1] || 'noreply@fullstp.com',
  defaultFromName: 'FullStop',
  sendEmail: async (message: SendEmailOptions) => {
    const to = toAddresses(message.to)
    const from = fromAddress(message)
    const subject = message.subject ?? ''
    const html = typeof message.html === 'string' ? message.html : undefined
    const text = typeof message.text === 'string' ? message.text : undefined

    // 1. Local SMTP (Exim) preferred.
    const smtp = getSmtpTransport()
    if (smtp) {
      const info = await smtp.sendMail({ from, to, subject, html, text })
      return info
    }

    // 2. Resend fallback.
    const resend = getResendClient()
    if (resend) {
      // Resend's CreateEmailOptions is a union requiring html|text|react; our
      // transactional mail is always HTML. Cast to satisfy the discriminator.
      const payload = { from, to, subject, html: html ?? text ?? '', text } as Parameters<
        typeof resend.emails.send
      >[0]
      const { data, error } = await resend.emails.send(payload)
      if (error) {
        console.error('[email] Resend send failed:', error)
        throw new Error(`Resend send failed: ${error.message}`)
      }
      return data
    }

    // 3. No transport configured.
    console.warn(
      `[email] No SMTP_HOST or RESEND_API_KEY — skipping email "${subject}" to ${to.join(', ')}`,
    )
    return { skipped: true }
  },
})
