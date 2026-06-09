/**
 * Seed cool marketplace components (kind=creator-block-spec) on the running
 * control plane, acting as a creator. Concrete copy (cart components are added
 * as-is, no token filling). Prints created ids for admin approval.
 *
 * Usage:  node scripts/seed-more-components.cjs   (run from nodeapp root)
 * Env:    BASE (default http://127.0.0.1:3100)
 */
const BASE = process.env.BASE || 'http://127.0.0.1:3100'
const EMAIL = `components+${Date.now()}@fullstp.com`
const PASSWORD = 'Creator1234!'

let cookie = ''
async function api(path, opts = {}) {
  const res = await fetch(BASE + path, {
    ...opts,
    headers: { 'Content-Type': 'application/json', ...(cookie ? { cookie } : {}), ...(opts.headers || {}) },
  })
  const sc = typeof res.headers.getSetCookie === 'function' ? res.headers.getSetCookie() : []
  for (const s of sc) {
    const kv = s.split(';')[0]
    if (kv.startsWith('payload-token=')) cookie = kv
  }
  let body = null
  try {
    body = await res.json()
  } catch {}
  return { status: res.status, body }
}

const sec = (props, children) => ({ type: 'section', ...props, children })
const stack = (props, children) => ({ type: 'stack', ...props, children })
const grid = (props, children) => ({ type: 'grid', ...props, children })
const container = (children) => ({ type: 'container', children })
const h = (text, level = 2, align) => ({ type: 'heading', text, level, ...(align ? { align } : {}) })
const t = (text, props = {}) => ({ type: 'text', text, ...props })
const btn = (label, href, style = 'primary') => ({ type: 'button', label, href, style })
const badge = (text, tone = 'neutral') => ({ type: 'badge', text, tone })

const components = [
  {
    name: 'Pricing Trio', category: 'product',
    description: 'Three-tier pricing with highlighted plan and CTAs.',
    nodes: [sec({ background: 'muted', padding: 'lg' }, [container([
      h('Simple, transparent pricing', 2, 'center'),
      t('Pick a plan that scales with you. No hidden fees.', { align: 'center', muted: true }),
      { type: 'spacer', size: 'md' },
      grid({ columns: 3, gap: 'md' }, [
        stack({ gap: 'sm', align: 'start' }, [badge('Starter', 'neutral'), h('$9/mo', 3), t('For solo makers getting started.'), btn('Choose Starter', '/contact', 'outline')]),
        stack({ gap: 'sm', align: 'start' }, [badge('Most popular', 'accent'), h('$29/mo', 3), t('For growing teams that need more.'), btn('Choose Pro', '/contact', 'primary')]),
        stack({ gap: 'sm', align: 'start' }, [badge('Scale', 'neutral'), h('$99/mo', 3), t('For high-volume businesses.'), btn('Choose Scale', '/contact', 'outline')]),
      ]),
    ])])],
  },
  {
    name: 'FAQ Accordion', category: 'other',
    description: 'Clean question-and-answer list to handle objections.',
    nodes: [sec({ background: 'none', padding: 'lg' }, [container([
      h('Frequently asked questions', 2, 'center'),
      { type: 'spacer', size: 'sm' },
      stack({ gap: 'md', align: 'start' }, [
        stack({ gap: 'sm' }, [h('Is there a free trial?', 4), t('Yes — 14 days, no credit card required.', { muted: true })]),
        { type: 'divider' },
        stack({ gap: 'sm' }, [h('Can I cancel anytime?', 4), t('Absolutely. Cancel in one click from your dashboard.', { muted: true })]),
        { type: 'divider' },
        stack({ gap: 'sm' }, [h('Do you offer support?', 4), t('Every plan includes email support; Pro adds priority chat.', { muted: true })]),
      ]),
    ])])],
  },
  {
    name: 'Stats Band', category: 'about',
    description: 'Bold dark band of headline metrics.',
    nodes: [sec({ background: 'dark', padding: 'lg' }, [container([
      grid({ columns: 4, gap: 'md' }, [
        stack({ gap: 'none', align: 'center' }, [h('10k+', 2, 'center'), t('Happy customers', { align: 'center' })]),
        stack({ gap: 'none', align: 'center' }, [h('99.9%', 2, 'center'), t('Uptime', { align: 'center' })]),
        stack({ gap: 'none', align: 'center' }, [h('4.9/5', 2, 'center'), t('Average rating', { align: 'center' })]),
        stack({ gap: 'none', align: 'center' }, [h('24/7', 2, 'center'), t('Support', { align: 'center' })]),
      ]),
    ])])],
  },
  {
    name: 'Trust Bar', category: 'homepage',
    description: 'Social-proof strip of trusted-by labels.',
    nodes: [sec({ background: 'muted', padding: 'sm' }, [container([
      t('Trusted by teams at', { align: 'center', muted: true, size: 'sm' }),
      { type: 'spacer', size: 'sm' },
      grid({ columns: 4, gap: 'md' }, [
        h('Northwind', 4, 'center'), h('Acme Co', 4, 'center'), h('Globex', 4, 'center'), h('Initech', 4, 'center'),
      ]),
    ])])],
  },
  {
    name: 'Newsletter CTA', category: 'contact',
    description: 'Accent call-to-action to capture emails.',
    nodes: [sec({ background: 'accent', padding: 'lg', align: 'center' }, [container([
      stack({ gap: 'sm', align: 'center' }, [
        h('Join our newsletter', 2, 'center'),
        t('Get product updates and tips. No spam, unsubscribe anytime.', { align: 'center' }),
        btn('Subscribe', '/contact', 'secondary'),
      ]),
    ])])],
  },
  {
    name: 'Team Grid', category: 'about',
    description: 'Meet-the-team cards with photos.',
    nodes: [sec({ background: 'none', padding: 'lg' }, [container([
      h('Meet the team', 2, 'center'),
      { type: 'spacer', size: 'sm' },
      grid({ columns: 3, gap: 'md' }, [
        stack({ gap: 'sm', align: 'center' }, [{ type: 'image', src: '#', alt: 'Team member', aspect: 'square', rounded: true }, h('Jordan Lee', 4, 'center'), t('Founder & CEO', { align: 'center', muted: true })]),
        stack({ gap: 'sm', align: 'center' }, [{ type: 'image', src: '#', alt: 'Team member', aspect: 'square', rounded: true }, h('Sam Rivera', 4, 'center'), t('Head of Product', { align: 'center', muted: true })]),
        stack({ gap: 'sm', align: 'center' }, [{ type: 'image', src: '#', alt: 'Team member', aspect: 'square', rounded: true }, h('Casey Kim', 4, 'center'), t('Lead Engineer', { align: 'center', muted: true })]),
      ]),
    ])])],
  },
  {
    name: 'Feature Split', category: 'services',
    description: 'Two-column image + copy with CTA.',
    nodes: [sec({ background: 'none', padding: 'lg' }, [container([
      grid({ columns: 2, gap: 'lg' }, [
        stack({ gap: 'sm', align: 'start' }, [badge('Why us', 'accent'), h('Built for speed and scale', 2), t('Everything you need to launch fast and grow without limits — backed by a team that cares.'), btn('Learn more', '/about', 'primary')]),
        { type: 'image', src: '#', alt: 'Product', aspect: 'video', rounded: true },
      ]),
    ])])],
  },
  {
    name: 'Big Testimonial', category: 'about',
    description: 'Single spotlight quote with attribution.',
    nodes: [sec({ background: 'muted', padding: 'lg', align: 'center' }, [container([
      stack({ gap: 'sm', align: 'center' }, [
        badge('Loved by customers', 'success'),
        h('“This completely changed how we work. We shipped in days, not months.”', 2, 'center'),
        t('— Alex Morgan, COO at Brightline', { align: 'center', muted: true }),
      ]),
    ])])],
  },
  {
    name: 'How It Works', category: 'services',
    description: 'Three-step explainer.',
    nodes: [sec({ background: 'none', padding: 'lg' }, [container([
      h('How it works', 2, 'center'),
      { type: 'spacer', size: 'sm' },
      grid({ columns: 3, gap: 'md' }, [
        stack({ gap: 'sm', align: 'start' }, [badge('1', 'accent'), h('Sign up', 4), t('Create your account in under a minute.', { muted: true })]),
        stack({ gap: 'sm', align: 'start' }, [badge('2', 'accent'), h('Customize', 4), t('Pick components and make them yours.', { muted: true })]),
        stack({ gap: 'sm', align: 'start' }, [badge('3', 'accent'), h('Launch', 4), t('Go live and start growing today.', { muted: true })]),
      ]),
    ])])],
  },
]

async function main() {
  console.log('creator email:', EMAIL)
  console.log('signup:', (await api('/api/customers', { method: 'POST', body: JSON.stringify({ email: EMAIL, password: PASSWORD, name: 'Component Creator' }) })).status)
  console.log('login:', (await api('/api/customers/login', { method: 'POST', body: JSON.stringify({ email: EMAIL, password: PASSWORD }) })).status)
  const cr = await api('/api/customers/me/creator', { method: 'POST' })
  console.log('enable creator:', cr.status, JSON.stringify(cr.body))

  const ids = []
  for (const c of components) {
    const res = await api('/api/marketplace', {
      method: 'POST',
      body: JSON.stringify({ name: c.name, kind: 'creator-block-spec', category: c.category, description: c.description, submit: true, spec: { nodes: c.nodes } }),
    })
    if (res.status === 201) {
      ids.push(res.body?.template?.id)
      console.log(`  ✓ ${c.name} → id ${res.body?.template?.id}`)
    } else {
      console.log(`  ✗ ${c.name} → HTTP ${res.status}`, JSON.stringify(res.body))
    }
  }
  console.log('SUBMITTED_IDS=' + ids.join(','))
}

main().catch((e) => {
  console.error('FAIL', e)
  process.exit(1)
})
