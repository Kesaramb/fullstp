import type { AccessArgs } from 'payload'

export const authenticated = ({ req: { user } }: AccessArgs): boolean => Boolean(user)
