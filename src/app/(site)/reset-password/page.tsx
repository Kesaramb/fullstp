import ResetPasswordForm from '@/components/ResetPasswordForm'

export const dynamic = 'force-dynamic'

export default async function ResetPasswordPage({
  searchParams,
}: {
  searchParams: Promise<{ token?: string | string[] }>
}) {
  const { token } = await searchParams
  const value = Array.isArray(token) ? token[0] : token
  return <ResetPasswordForm token={value ?? ''} />
}
