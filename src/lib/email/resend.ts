import { Resend } from 'resend'

const FROM = 'FullStop <noreply@fullstp.app>'

function getResendClient(): Resend | null {
  const key = process.env.RESEND_API_KEY
  if (!key) return null
  return new Resend(key)
}

export async function sendDeploymentNotification(params: {
  customerEmail: string
  customerName?: string
  businessName: string
  domain: string
  adminEmail?: string
  adminPassword?: string
}): Promise<void> {
  const resend = getResendClient()
  if (!resend) {
    console.warn('[email] RESEND_API_KEY not set — skipping deployment notification')
    return
  }

  const { customerEmail, customerName, businessName, domain, adminEmail, adminPassword } = params

  const greeting = customerName ? `Hi ${customerName},` : 'Hi there,'
  const adminSection = adminEmail
    ? `
      <tr>
        <td style="padding:16px 0 0;">
          <p style="margin:0 0 8px;font-size:14px;color:#374151;font-weight:600;">Your Payload Admin Access</p>
          <table style="background:#f9fafb;border:1px solid #e5e7eb;border-radius:8px;padding:12px 16px;width:100%;">
            <tr><td style="font-size:13px;color:#6b7280;padding:2px 0;">Email</td><td style="font-size:13px;color:#111827;font-weight:500;">${adminEmail}</td></tr>
            ${adminPassword ? `<tr><td style="font-size:13px;color:#6b7280;padding:2px 0;">Password</td><td style="font-size:13px;color:#111827;font-weight:500;">${adminPassword}</td></tr>` : ''}
          </table>
        </td>
      </tr>`
    : ''

  await resend.emails.send({
    from: FROM,
    to: customerEmail,
    subject: `🚀 ${businessName} is live!`,
    html: `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#f3f4f6;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f3f4f6;padding:40px 16px;">
    <tr><td align="center">
      <table width="600" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:12px;overflow:hidden;box-shadow:0 1px 3px rgba(0,0,0,.1);">
        <!-- Header gradient -->
        <tr>
          <td style="background:linear-gradient(135deg,#cbe5ff 0%,#e5f5f0 50%,#f8edda 100%);padding:32px 40px;text-align:center;">
            <p style="margin:0 0 8px;font-size:13px;font-weight:600;color:#374151;letter-spacing:.05em;text-transform:uppercase;">FullStop</p>
            <h1 style="margin:0;font-size:28px;font-weight:700;color:#111827;">Your site is live!</h1>
          </td>
        </tr>
        <!-- Body -->
        <tr>
          <td style="padding:32px 40px;">
            <table width="100%" cellpadding="0" cellspacing="0">
              <tr>
                <td>
                  <p style="margin:0 0 16px;font-size:16px;color:#374151;">${greeting}</p>
                  <p style="margin:0 0 24px;font-size:15px;color:#6b7280;line-height:1.6;">
                    <strong style="color:#111827;">${businessName}</strong> has been built and deployed by the FullStop AI factory. Your new website is live and ready for the world.
                  </p>
                  <!-- Domain card -->
                  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f0fdf4;border:1px solid #bbf7d0;border-radius:8px;padding:16px 20px;margin-bottom:24px;">
                    <tr>
                      <td>
                        <p style="margin:0 0 4px;font-size:12px;font-weight:600;color:#16a34a;text-transform:uppercase;letter-spacing:.05em;">Live URL</p>
                        <a href="https://${domain}" style="font-size:18px;font-weight:700;color:#111827;text-decoration:none;">https://${domain}</a>
                      </td>
                    </tr>
                  </table>
                  ${adminSection}
                  <tr>
                    <td style="padding:24px 0 0;">
                      <p style="margin:0 0 16px;font-size:14px;color:#6b7280;line-height:1.6;">
                        The FullStop Digital Team is now managing your site — monitoring performance, keeping content fresh, and handling SEO. You'll hear from us when there's something to report.
                      </p>
                      <table cellpadding="0" cellspacing="0">
                        <tr>
                          <td style="background:#111827;border-radius:8px;">
                            <a href="https://${domain}" style="display:inline-block;padding:12px 24px;font-size:14px;font-weight:600;color:#ffffff;text-decoration:none;">Visit Your Site →</a>
                          </td>
                        </tr>
                      </table>
                    </td>
                  </tr>
                </td>
              </tr>
            </table>
          </td>
        </tr>
        <!-- Footer -->
        <tr>
          <td style="border-top:1px solid #f3f4f6;padding:20px 40px;text-align:center;">
            <p style="margin:0;font-size:12px;color:#9ca3af;">Built by <a href="https://fullstp.app" style="color:#6b7280;text-decoration:none;">FullStop</a> · Zero-human digital agency</p>
          </td>
        </tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`,
  })
}
