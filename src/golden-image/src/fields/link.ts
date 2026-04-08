import type { Field, GroupField } from 'payload'

export interface LinkFieldOptions {
  disableLabel?: boolean
  appearances?: boolean
  overrides?: Partial<GroupField>
}

export function linkField(options: LinkFieldOptions = {}): Field {
  const { disableLabel = false, appearances = false, overrides = {} } = options

  const fields: Field[] = [
    {
      name: 'type',
      type: 'select',
      defaultValue: 'custom',
      options: [
        { label: 'Custom URL', value: 'custom' },
        { label: 'Internal Link', value: 'reference' },
      ],
    },
    {
      name: 'url',
      type: 'text',
      required: true,
      admin: {
        condition: (_data, siblingData) => siblingData?.type === 'custom',
      },
    },
    {
      name: 'reference',
      type: 'relationship',
      relationTo: 'pages',
      admin: {
        condition: (_data, siblingData) => siblingData?.type === 'reference',
      },
    },
    {
      name: 'newTab',
      type: 'checkbox',
      defaultValue: false,
    },
  ]

  if (!disableLabel) {
    fields.splice(1, 0, {
      name: 'label',
      type: 'text',
      required: true,
    })
  }

  if (appearances) {
    fields.push({
      name: 'appearance',
      type: 'select',
      defaultValue: 'default',
      options: [
        { label: 'Default', value: 'default' },
        { label: 'Outline', value: 'outline' },
      ],
    })
  }

  return {
    name: 'link',
    type: 'group',
    fields,
    ...overrides,
  } as Field
}
