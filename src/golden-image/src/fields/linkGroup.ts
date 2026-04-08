import type { ArrayField } from 'payload'
import { linkField, type LinkFieldOptions } from './link'

export interface LinkGroupOptions extends LinkFieldOptions {
  maxRows?: number
}

export function linkGroupField(options: LinkGroupOptions = {}): ArrayField {
  const { maxRows, ...linkOptions } = options

  return {
    name: 'links',
    type: 'array',
    maxRows,
    fields: [linkField(linkOptions)],
    admin: {
      initCollapsed: true,
    },
  }
}
