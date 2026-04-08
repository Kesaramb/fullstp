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

function normalizePath(path: string): string {
  const cleaned = path.split(/[?#]/)[0]?.trim() || '/'
  if (!cleaned.startsWith('/')) return cleaned
  return cleaned === '/' ? '/' : cleaned.replace(/\/+$/, '')
}

function pageSlugToPath(slug: string): string {
  return slug === 'home' ? '/' : `/${slug}`
}

function pickFallbackLink(currentPath: string, availablePaths: string[]): string {
  const uniquePaths = [...new Set(availablePaths.map(normalizePath))]
  const preferredOrder = currentPath === '/contact'
    ? ['/', '/about', ...uniquePaths]
    : ['/contact', '/about', ...uniquePaths, '/']

  return preferredOrder.find(path => path !== currentPath && uniquePaths.includes(path))
    || uniquePaths.find(path => path !== currentPath)
    || '/'
}

function sanitizeInternalLink(
  value: unknown,
  currentPath: string,
  availablePaths: string[],
): string | undefined {
  if (typeof value !== 'string') return undefined
  if (!value.startsWith('/')) return value

  const normalizedValue = normalizePath(value)
  if (normalizedValue !== currentPath) return value

  return pickFallbackLink(currentPath, availablePaths)
}

function normalizeBlock(
  block: Record<string, unknown>,
  currentPath: string,
  availablePaths: string[],
): Record<string, unknown> {
  let normalizedBlock = block

  if (block.blockType === 'featureGrid' && Array.isArray(block.features)) {
    normalizedBlock = {
      ...normalizedBlock,
      features: block.features.map(feature => {
        const featureRecord = typeof feature === 'object' && feature
          ? feature as Record<string, unknown>
          : {}

        return {
          ...featureRecord,
          icon: normalizeFeatureIcon(featureRecord.icon),
        }
      }),
    }
  }

  if (block.blockType === 'hero') {
    const ctaLink = sanitizeInternalLink(block.ctaLink, currentPath, availablePaths)
    return ctaLink ? { ...normalizedBlock, ctaLink } : normalizedBlock
  }

  if (block.blockType === 'callToAction') {
    const linkUrl = sanitizeInternalLink(block.linkUrl, currentPath, availablePaths)
    return linkUrl ? { ...normalizedBlock, linkUrl } : normalizedBlock
  }

  if (block.blockType === 'closingBanner') {
    const linkUrl = sanitizeInternalLink(block.linkUrl, currentPath, availablePaths)
    return linkUrl ? { ...normalizedBlock, linkUrl } : normalizedBlock
  }

  return normalizedBlock
}

export function normalizeContentPackage(content: ContentPackage): ContentPackage {
  const availablePaths = content.pages.map(page => pageSlugToPath(page.slug))

  return {
    ...content,
    pages: content.pages.map(page => ({
      ...page,
      layout: page.layout
        // Strip mediaBlock — requires an upload relationship we can't satisfy during seeding
        .filter(block => block.blockType !== 'mediaBlock')
        .map(block => normalizeBlock(block, pageSlugToPath(page.slug), availablePaths)),
    })),
  }
}
