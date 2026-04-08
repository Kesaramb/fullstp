import type { ContentPackage } from './types'

const featureIconAliases: Record<string, string> = {
  award: 'sparkles',
  gift: 'sparkles',
  globe: 'globe',
  heart: 'heart',
  leaf: 'leaf',
  shield: 'shield',
  sparkles: 'sparkles',
  star: 'star',
  target: 'target',
  trendingup: 'zap',
  trending_up: 'zap',
  user: 'users',
  users: 'users',
  zap: 'zap',
  clock: 'clock',
}

function normalizeFeatureIcon(icon: unknown): string {
  if (typeof icon !== 'string' || icon.trim().length === 0) return 'star'

  const normalized = icon.trim().toLowerCase().replace(/[^a-z_]/g, '')
  return featureIconAliases[normalized] || 'star'
}

export function normalizeContentPackage(content: ContentPackage): ContentPackage {
  return {
    ...content,
    pages: content.pages.map(page => ({
      ...page,
      layout: page.layout
        // Strip mediaBlock — requires an upload relationship we can't satisfy during seeding
        .filter(block => block.blockType !== 'mediaBlock')
        .map(block => {
          if (block.blockType !== 'featureGrid' || !Array.isArray(block.features)) {
            return block
          }

          return {
            ...block,
            features: block.features.map((feature: Record<string, unknown>) => ({
              ...feature,
              icon: normalizeFeatureIcon(feature.icon),
            })),
          }
        }),
    })),
  }
}
