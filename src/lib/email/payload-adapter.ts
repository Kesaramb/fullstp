import type { EmailAdapter, SendEmailOptions } from 'payload'
import { FROM, getResendClient } from './resend'

/**
 * Payload email adapter backed by Resend.
 *
 * Wires Payload's transactional email (forgot-password, verification, etc.)
 * through the same Resend integration used for deployment notifications.
 *
 * If RESEND_API_KEY is not set the adapter degrades gracefully: it logs a
 * warning and no-ops instead of throwing, so local/dev and build steps keep
 * working. Email only sends once the key is present in the environment.
 */

/** Normalise nodemailer's flexible `to`/`address` shapes into plain strings. */
function toAddresses(to: SendEmailOptions['to']): string[] {
  if (!to) return []
  const list = Array.isArray(to) ? to : [to]
  return list
    .map((entry) => (typeof entry === 'string' ? entry : entry?.address))
    .filter((addr): addr is string => Boolean(addr))
}

export const resendEmailAdapter: EmailAdapter = () => ({
  name: 'resend',
  defaultFromAddress: 'noreply@fullstp.app',
  defaultFromName: 'FullStop',
  sendEmail: async (message: SendEmailOptions) => {
    const resend = getResendClient()
    const to = toAddresses(message.to)

    if (!resend) {
      console.warn(
        `[email] RESEND_API_KEY not set — skipping email "${message.subject ?? ''}" to ${to.join(', ')}`,
      )
      return { skipped: true }
    }

    const from =
      typeof message.from === 'string' && message.from.trim() ? message.from : FROM

    const { data, error } = await resend.emails.send({
      from,
      to,
      subject: message.subject ?? '',
      html: typeof message.html === 'string' ? message.html : undefined,
      text: typeof message.text === 'string' ? message.text : undefined,
    })

    if (error) {
      console.error('[email] Resend send failed:', error)
      throw new Error(`Resend send failed: ${error.message}`)
    }
    return data
  },
})
