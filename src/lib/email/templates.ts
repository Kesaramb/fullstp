/**
 * Branded HTML for transactional emails. Kept as plain string templates so
 * they render identically across email clients (no external CSS/JS).
 */

/** Password-reset email sent to customers. `url` is the tokenised reset link. */
export function forgotPasswordEmailHTML(url: string): string {
  return `<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#f3f4f6;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f3f4f6;padding:40px 16px;">
    <tr><td align="center">
      <table width="600" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:12px;overflow:hidden;box-shadow:0 1px 3px rgba(0,0,0,.1);">
        <tr>
          <td style="background:linear-gradient(135deg,#cbe5ff 0%,#e5f5f0 50%,#f8edda 100%);padding:32px 40px;text-align:center;">
            <p style="margin:0 0 8px;font-size:13px;font-weight:600;color:#374151;letter-spacing:.05em;text-transform:uppercase;">FullStop</p>
            <h1 style="margin:0;font-size:26px;font-weight:700;color:#111827;">Reset your password</h1>
          </td>
        </tr>
        <tr>
          <td style="padding:32px 40px;">
            <p style="margin:0 0 16px;font-size:15px;color:#374151;line-height:1.6;">
              We received a request to reset the password for your FullStop account. Click the button below to choose a new one. This link expires in 1 hour.
            </p>
            <table cellpadding="0" cellspacing="0" style="margin:24px 0;">
              <tr>
                <td style="background:#111827;border-radius:8px;">
                  <a href="${url}" style="display:inline-block;padding:12px 28px;font-size:14px;font-weight:600;color:#ffffff;text-decoration:none;">Reset password →</a>
                </td>
              </tr>
            </table>
            <p style="margin:0 0 8px;font-size:13px;color:#6b7280;line-height:1.6;">
              If the button doesn't work, paste this link into your browser:
            </p>
            <p style="margin:0 0 24px;font-size:13px;word-break:break-all;"><a href="${url}" style="color:#2563eb;text-decoration:none;">${url}</a></p>
            <p style="margin:0;font-size:13px;color:#9ca3af;line-height:1.6;">
              If you didn't request this, you can safely ignore this email — your password won't change.
            </p>
          </td>
        </tr>
        <tr>
          <td style="border-top:1px solid #f3f4f6;padding:20px 40px;text-align:center;">
            <p style="margin:0;font-size:12px;color:#9ca3af;">Sent by <a href="https://fullstp.com" style="color:#6b7280;text-decoration:none;">FullStop</a></p>
          </td>
        </tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`
}
