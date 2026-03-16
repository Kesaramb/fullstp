import type { CollectionConfig } from 'payload'

export const BMCs: CollectionConfig = {
  slug: 'bmcs',
  admin: {
    useAsTitle: 'businessName',
    defaultColumns: ['businessName', 'industry', 'brandMood', 'createdAt'],
  },
  access: {
    read: () => true,
    create: () => true,
    update: () => true,
    delete: () => true,
  },
  fields: [
    {
      name: 'businessName',
      type: 'text',
      required: true,
    },
    {
      name: 'industry',
      type: 'text',
      required: true,
    },
    {
      name: 'tagline',
      type: 'text',
    },
    {
      name: 'valueProposition',
      type: 'textarea',
    },
    {
      name: 'targetSegments',
      type: 'array',
      fields: [
        {
          name: 'segment',
          type: 'text',
          required: true,
        },
      ],
    },
    {
      name: 'blocks',
      type: 'array',
      admin: {
        description: 'Block types identified for this business.',
      },
      fields: [
        {
          name: 'blockType',
          type: 'text',
          required: true,
        },
      ],
    },
    {
      name: 'brandMood',
      type: 'text',
      admin: {
        description: 'E.g., "rustic-modern, warm and artisanal"',
      },
    },
    {
      name: 'rawStrategyConversation',
      type: 'json',
      admin: {
        description: 'Full CEO Agent strategy conversation that produced this BMC.',
      },
    },
  ],
}
