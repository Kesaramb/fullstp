# FullStop Business Model Canvas
## fullstp.com — Zero-Human Digital Agency

*Built on the Osterwalder BMC framework. Covers every service a full-stack digital marketing agency delivers — executed by AI agents instead of humans.*

---

## CANVAS OVERVIEW

```
┌─────────────────┬──────────────────┬──────────────┬───────────────────┬─────────────────┐
│  KEY            │  KEY             │  VALUE       │  CUSTOMER         │  CUSTOMER       │
│  PARTNERS       │  ACTIVITIES      │  PROPOSITIONS│  RELATIONSHIPS    │  SEGMENTS       │
│                 │                  │              │                   │                 │
│  Anthropic      │  AI Factory      │  Your full   │  Always-on chat   │  Local service  │
│  Cloudflare     │  Pipeline        │  digital     │  AI team          │  SMEs           │
│  HestiaCP       │  Digital Team    │  team from   │  No CMS training  │  Solo founders  │
│  Resend         │  Ops             │  $99/mo      │  Proactive reports│  Agencies       │
│  Unsplash       │  Platform R&D    │  Ejectable   │  Ejectable exit   │  Franchises     │
├─────────────────┴──────────────────┤  code        ├───────────────────┼─────────────────┤
│  KEY RESOURCES                     │              │  CHANNELS         │                 │
│                                    │              │                   │                 │
│  Repo OS (6-layer agent OS)        │              │  fullstp.com      │                 │
│  Golden Image boilerplate          │              │  Product Hunt     │                 │
│  AI agent swarm (7 specialists)    │              │  Chambers of      │                 │
│  Claude API access                 │              │  commerce         │                 │
│  Infrastructure (HestiaCP+PM2)     │              │  Agency partners  │                 │
│  Domain: fullstp.com               │              │  LinkedIn/X       │                 │
├────────────────────────────────────┴──────────────┴───────────────────┴─────────────────┤
│  COST STRUCTURE                                   │  REVENUE STREAMS                    │
│                                                   │                                     │
│  Claude API tokens (variable, ~$3/build)          │  Starter: $99/mo per tenant         │
│  Infrastructure hosting (fixed)                   │  Growth:  $249/mo per tenant        │
│  Resend email (variable)                          │  Scale:   $499/mo per tenant        │
│  Cloudflare R2 storage (variable)                 │  Add-ons: extra pages, integrations │
│  Domain & SSL (fixed)                             │  White-label: agency reseller fee   │
│  Founder/team (fixed, Phase 1)                    │  Enterprise: custom pricing         │
└───────────────────────────────────────────────────┴─────────────────────────────────────┘
```

---

## BLOCK 1 — CUSTOMER SEGMENTS

### Primary: Local Service SMEs (wedge vertical)
The highest-pain, most immediate-ROI segment. These businesses need leads, not aesthetics.

| Sub-segment | Size | Digital need | Pain level |
|-------------|------|-------------|-----------|
| Health & wellness clinics | Large | New patients, hours, services | 🔴 High |
| Hair & beauty salons | Large | Bookings, portfolio, offers | 🔴 High |
| Trade contractors (plumbers, electricians) | Very large | Lead generation, trust signals | 🔴 High |
| Restaurants & cafés | Large | Menu, reservations, location | 🔴 High |
| Accountants & financial advisers | Large | Credibility, lead gen | 🟡 Medium |
| Real estate agents | Large | Listings, reputation | 🟡 Medium |
| Personal trainers & gyms | Large | Bookings, programmes | 🔴 High |
| Law firms (small) | Medium | Trust, case types, contact | 🟡 Medium |
| Consultants & coaches | Large | Personal brand, services | 🔴 High |
| Retail shops (local) | Medium | Products, hours, events | 🟡 Medium |

### Secondary: Solo Founders & Bootstrappers
Technical enough to appreciate ejectable repos. Value code ownership strongly.

### Tertiary: Small Agencies & Freelancers (channel partners)
Use FullStop as a white-label AI production backend. Convert delivery cost into margin.

### Quaternary: Franchises & Multi-location Businesses
Standardised brand, multiple sites. High volume, high LTV, reusable templates.

---

## BLOCK 2 — VALUE PROPOSITIONS

### The Core Promise
> *"A full AI digital team — permanently hired by your business — that builds your online presence and evolves it as a digital media entity. You own everything they produce."*

### By Job-to-be-Done

#### 1. Launch a professional digital presence fast
**Traditional:** 8–16 weeks, $10K–$50K agency fee
**FullStop:** Chat → live site in hours, from $99/month
- Strategy extraction via CEO Agent
- Visual identity: palette, typography, hero layout
- Production-grade copy for every page section
- Deployed to live URL with SSL + custom domain

#### 2. Website Design & Development (replaces agency)
- AI design system: 6 colour palettes, 5 font pairings, 3 hero variants
- 10 reusable block types: Hero, Feature Grid, Brand Narrative, Testimonials, Rich Content, CTA, Closing Banner, Form, Media, Banner
- Next.js 15 + Payload CMS 3.12 — real production stack, not throwaway HTML
- Mobile-first, WCAG AA accessible, 4/8px spacing system
- Page presets per business archetype (service, product, experience, creative, local, SaaS)

#### 3. Content Marketing (replaces copywriter)
- Emotionally resonant copy for every section of every page
- AI-written blog posts (Growth + Scale tiers)
- SEO-optimised headings, meta titles, descriptions
- Brand voice maintained consistently across all content
- Testimonial generation and placement
- Archetype-aware copy rules (product vs service vs experience vs local)

#### 4. SEO — Technical, On-Page, Local (replaces SEO agency)
- Technical SEO baked into every deployment: sitemap, robots.txt, canonical tags, structured data
- On-page SEO: heading hierarchy, keyword placement, meta descriptions
- Local SEO: NAP consistency, location signals, opening hours schema
- Content freshness: ongoing updates prevent ranking decay
- Core Web Vitals: Next.js ISR + Tailwind = fast by default

#### 5. Ongoing Content Management (replaces content manager)
- Chat-to-update interface: "Add a brunch menu page" → done
- No CMS training required — Digital Team agents execute all changes
- Seasonal content updates (offers, events, promotions)
- New page creation on demand
- Image management via AI-matched Unsplash photography

#### 6. Email Marketing (replaces email marketer)
- Post-deployment notification emails (Resend)
- Transactional communications
- Future: campaign planning, list management, sequence creation via Digital Team agents

#### 7. Social Media Management (Digital Team roadmap)
- Content calendar generation per business archetype
- Social copy derived from website brand voice
- Post scheduling and publishing
- Analytics monitoring and reporting

#### 8. Analytics & Reporting (replaces analyst)
- Monthly performance reports (Growth + Scale)
- Deployment health monitoring
- Content performance tracking
- Lead generation attribution

#### 9. Brand Strategy & Identity (replaces brand consultant)
- CEO Agent extracts brand positioning from plain conversation
- Messaging pillars, target audience, competitive differentiation
- Brand voice document generated per client
- Visual identity selected and locked per deployment
- Business Model Canvas generated and stored per client

#### 10. Code Ownership & Data Sovereignty (no agency equivalent)
**Unique to FullStop — no competitor offers this:**
- Every site is a real Next.js + Payload CMS git repository
- SQLite database: per-tenant, isolated, portable
- `docker compose up` = full site running independently
- Ejectable: zero vendor lock-in, zero migration cost
- Client owns code, content, database — unconditionally

---

## BLOCK 3 — CHANNELS

### Acquisition Channels

| Channel | Stage | Cost | Priority |
|---------|-------|------|----------|
| fullstp.com (marketing homepage) | Awareness → Trial | Low | 🔴 P1 |
| Product Hunt | Launch awareness | Low | 🔴 P1 |
| Founder LinkedIn | Awareness → Intent | Low | 🔴 P1 |
| AI/product newsletters (Ben's Bites, The Rundown, TLDR) | Awareness | Low | 🔴 P1 |
| Hacker News (Show HN) | Awareness + credibility | Free | 🔴 P1 |
| Australian press (AFR, SmartCompany, StartupSmart) | Awareness | PR effort | 🟡 P2 |
| Chamber of commerce talks | High-intent local | Speaking time | 🟡 P2 |
| Agency partner referrals | Qualified leads | Rev share | 🟡 P2 |
| Accounting software integrations (Xero, MYOB) | Distribution at scale | BD effort | 🔴 P1 (long) |
| Podcast appearances | Warm awareness | Time | 🟡 P2 |
| Paid social (Meta — local business targeting) | Intent capture | Budget | 🟠 P3 |
| SEO (organic — "AI website builder", "AI digital agency") | Long-term | Content | 🟠 P3 |

### Delivery Channels (how the product is delivered)

| Channel | What happens here |
|---------|------------------|
| fullstp.com/launch | CEO Agent onboarding chat |
| SSE streaming API | Real-time factory pipeline updates |
| Resend email | Deployment confirmation + admin credentials |
| Tenant subdomain (*.fullstp.app) | Live delivered site |
| Custom domain | Client's own domain, configured post-deployment |
| Payload admin panel | Internal-only: agents operate this, not clients |

---

## BLOCK 4 — CUSTOMER RELATIONSHIPS

### Relationship Model: "Hire, not subscribe"
Customers don't feel like they've bought software. They've hired a team. The relationship mirrors an employment relationship — they direct, the team executes.

| Relationship type | How it works | FullStop implementation |
|------------------|-------------|------------------------|
| **Onboarding** | Initial briefing session | CEO Agent strategy chat — plain language |
| **Ongoing operations** | Team receives and executes work requests | Digital Team agents via chat interface |
| **Reporting** | Monthly performance summary | AI-generated analytics report |
| **Proactive updates** | Team suggests improvements | Digital Team agent initiates content recommendations |
| **Issue resolution** | Something's wrong — fix it | Chat, immediate response, no ticket queue |
| **Offboarding** | Customer leaves | Ejectable: repo download, no friction, no guilt |

### Trust Architecture
Three trust signals built into the product — not just marketing:

1. **Ejectable code** — You can always leave. That's structural honesty.
2. **Deployment email** — Admin credentials delivered to customer immediately. They have full access.
3. **Live URL** — Within hours of signing up, there is a real website at a real address they can verify.

### Self-Service vs. Assisted

| Tier | Relationship model |
|------|--------------------|
| Starter | Largely self-directed via chat; factory + basic Digital Team |
| Growth | AI team proactive: SEO, content suggestions, analytics |
| Scale | Highest-touch AI: dedicated agents, weekly sprints, custom scope |

---

## BLOCK 5 — REVENUE STREAMS

### Primary: Monthly Subscription (MRR)

| Tier | Price | Target customer | Annualised |
|------|-------|----------------|-----------|
| Starter | $99/mo | Solo founders, local businesses | $1,188/yr |
| Growth | $249/mo | Growing SMBs | $2,988/yr |
| Scale | $499/mo | Established businesses, multi-location | $5,988/yr |

**At 1,000 tenants on Growth average: $249K MRR / $3M ARR**
**At 5,000 tenants on Growth average: $1.245M MRR / $15M ARR**

### Secondary: Usage-Based Add-ons
| Add-on | Price | Trigger |
|--------|-------|---------|
| Extra pages (beyond tier limit) | $19/page | Page count exceeded |
| Custom block development | $299 one-time | Non-standard UI requirement |
| E-commerce integration | $49/mo | Product catalogue + checkout |
| Priority build queue | $49/mo | Skip queue on factory pipeline |
| Additional domain | $15/mo | Multi-domain or subdomain |

### Tertiary: Channel / White-Label
| Model | Structure |
|-------|-----------|
| Agency reseller | 30% discount off retail; agency bills client at full rate |
| White-label | Agency's branding, FullStop's infrastructure; per-tenant fee |
| Franchise deal | Volume pricing; $X per location per month |
| Enterprise | Custom contract; dedicated infrastructure; SLA |

### Future Revenue Streams (Phase 3)
| Stream | Description |
|--------|-------------|
| Social media management | AI agents posting and scheduling on all platforms |
| Email campaign management | Sequences, newsletters, list management |
| Paid advertising management | Google Ads + Meta Ads via AI agent |
| PR distribution | Press release generation + wire distribution |
| Digital talent marketplace | FullStop-certified human escalation layer |

---

## BLOCK 6 — KEY RESOURCES

### Intellectual / Technical
| Resource | Description | Replaceability |
|----------|-------------|---------------|
| **Repo OS** | 6-layer agent execution architecture (Context → Skills → Execution → Verification → Session → Oversight) | Hard to replicate — years of tuning |
| **Golden Image** | Master Next.js + Payload CMS boilerplate, cloned per tenant | Hard — all design system + block library |
| **Agent Swarm (7 agents)** | CEO Agent, Design Director, Content Writer, UI Architect, Payload Expert, DevOps, Digital Team | Moderate — prompts are the IP |
| **Block Library** | 10 production-grade UI blocks with design variants | Moderate |
| **Prompt caching system** | 60% reduction in per-request API cost | Low — technical implementation |
| **Domain: fullstp.com** | Brand and distribution anchor | Irreplaceable |

### Infrastructure
| Resource | Provider | Role |
|----------|----------|------|
| Application hosting | HestiaCP + PM2 (Phase 1) | Tenant process management |
| Tenant routing | Nginx (via HestiaCP) | Domain → port mapping |
| Media storage | Cloudflare R2 | Uploaded images, zero egress |
| Email delivery | Resend | Transactional notifications |
| AI inference | Anthropic (Claude API) | All agent calls |
| Photography | Unsplash API | AI-matched imagery |

### Human (Phase 1)
| Role | What they do |
|------|-------------|
| Founder / CEO | Product, vision, GTM, investor relations |
| Technical lead | Repo OS maintenance, agent tuning, infra |
| (All delivery is AI — no human delivery staff) | |

---

## BLOCK 7 — KEY ACTIVITIES

### The Factory Pipeline (per tenant, per build)
Every new customer triggers this exact sequence — deterministic, auditable, self-healing:

```
t0  Persist BMC + Customer record         (Payload Local API)
t1  Queen: StrategyBrief                  (claude-sonnet-4-6)
t2  Design Director: DesignBrief          (claude-haiku-4-5)
t3  Content Writer: WrittenCopy           (claude-sonnet-4-6)
t4  UI Architect: FrontendDesign          (claude-sonnet-4-6)
t5  Payload Expert: ContentPackage        (claude-sonnet-4-6)
t6  Queen: Byzantine consensus + heal     (claude-sonnet-4-6)
t7  DevOps: SSH deploy to HestiaCP        (node-ssh)
t8  seedRemoteContent()                   (Payload REST API)
t9  Persist deployment, notify, handoff   (Resend + SSE)
```

### Digital Team Operations (ongoing, per tenant)
Activities the AI team performs after site launch:

| Activity | Frequency | Trigger |
|----------|-----------|---------|
| Content update | On request | Customer chat message |
| New page creation | On request | Customer chat message |
| Blog post generation | Weekly (Growth+) | Scheduled sprint |
| SEO metadata refresh | Monthly | Automated |
| Performance report | Monthly (Growth+) | Scheduled |
| Site health check | Daily | Automated |
| Image refresh | On request | Customer chat message |

### Platform R&D (ongoing)
| Activity | Purpose |
|----------|---------|
| Golden Image maintenance | All tenant sites benefit from block improvements |
| Agent prompt tuning | Output quality improvement |
| New block development | Expand design vocabulary |
| New archetype support | New vertical templates |
| Scaling infrastructure | Phase 2: Docker containerisation |

### Digital Marketing for FullStop Itself
*(Eating our own cooking — FullStop's own digital presence is managed by FullStop agents)*

| Activity | Owner | Cadence |
|----------|-------|---------|
| fullstp.com content updates | Digital Team agents | Weekly |
| Blog content: "How local businesses win online" | Content Writer agent | Weekly |
| SEO optimisation | Digital Team agent | Monthly |
| Social content (LinkedIn, X) | Content Writer + Founder | 3×/week |
| PR outreach | Founder | Weekly |
| Podcast appearances | Founder | Monthly |
| Chamber presentations | Founder | Monthly |
| Case study production | Founder + agents | Monthly |

---

## BLOCK 8 — KEY PARTNERSHIPS

### Tier 1: Critical Infrastructure Partners
| Partner | What they provide | Dependency level |
|---------|------------------|-----------------|
| **Anthropic** | Claude API — all agent intelligence | 🔴 Critical |
| **Cloudflare** | R2 storage, CDN, DNS | 🟡 High |
| **HestiaCP** | Hosting panel, domain/SSL management | 🟡 High (Phase 1) |
| **Resend** | Transactional email delivery | 🟠 Medium |
| **Unsplash** | AI-matched photography | 🟠 Medium |

### Tier 2: Distribution Partners (to build)
| Partner | What they provide | Engagement model |
|---------|------------------|-----------------|
| **Accounting software** (Xero, MYOB, QuickBooks) | Direct SME channel | Integration + co-marketing |
| **Small agencies** | White-label reseller | Revenue share program |
| **Business coaches & consultants** | High-trust referrals | Affiliate program |
| **Chambers of commerce** | Local business network | Sponsored presentations |
| **Franchisors** | Volume, consistency | Enterprise deal |
| **Small business banks & lenders** | Direct SME relationship | Bundled offering |

### Tier 3: Media & PR Partners (to build)
| Partner | What they provide |
|---------|-----------------|
| AI/product newsletters | Awareness to tech-savvy buyers |
| Australian startup press | Local credibility |
| Business chambers | Speaking opportunities |

### Key Partnership Principle
FullStop does not compete with agencies — it offers itself as their production backend. "If you're a small agency, we are your AI team. White-label us and keep the margin."

---

## BLOCK 9 — COST STRUCTURE

### Variable Costs (scale with tenant count)
| Cost | Driver | Estimated per tenant/month |
|------|--------|--------------------------|
| Claude API tokens (build) | Per factory run | ~$3–8 |
| Claude API tokens (Digital Team) | Per request, per month | ~$2–5 |
| Prompt caching savings | 60% reduction on system prompts | offsets above |
| Cloudflare R2 storage | Per tenant media | ~$0.10 |
| Resend email | Per deployment notification | ~$0.01 |
| Unsplash API | Per image fetch | ~$0.10 |
| Server hosting (per tenant) | PM2 process, disk, RAM | ~$2–4 |
| **Total variable cost per tenant** | | **~$7–17/month** |

### Fixed Costs (Phase 1)
| Cost | Monthly estimate |
|------|-----------------|
| Founder salary / draw | [market rate] |
| Core infrastructure (base server) | $50–200 |
| Domain & certificates | $15 |
| Tooling (GitHub, monitoring) | $50 |
| Legal & accounting | $200 |

### Gross Margin Analysis
| Tier | Price | Variable cost | Gross margin |
|------|-------|--------------|-------------|
| Starter | $99 | ~$17 | ~83% |
| Growth | $249 | ~$17 | ~93% |
| Scale | $499 | ~$17 | ~97% |

*Margins improve as prompt caching matures and the Golden Image reduces generation errors (fewer retries).*

### Cost Reduction Levers
1. **Prompt caching** — `cache_control: ephemeral` on all system prompts. Already implemented. ~60% off repeated API calls.
2. **Model routing** — Haiku for selection tasks, Sonnet for creative/reasoning. Already implemented.
3. **Preset library** — Pre-validated page templates reduce agent computation per build.
4. **Golden Image compound** — Better boilerplate = fewer healing passes = fewer API calls.
5. **Phase 2 containerisation** — Docker per tenant = better density, lower infra cost per unit.

---

## DIGITAL MARKETING AGENCY SERVICE MAP

*Every service a traditional digital marketing agency offers — and how FullStop delivers it via AI agents.*

| Agency service | Traditional delivery | FullStop delivery | Status |
|---------------|---------------------|------------------|--------|
| Brand strategy | Senior strategist, workshops | CEO Agent chat → StrategyBrief | ✅ Live |
| Visual identity | Designer, 2–4 weeks | Design Director Agent → DesignBrief | ✅ Live |
| Website design | Designer, 4–8 weeks | UI Architect Agent → FrontendDesign | ✅ Live |
| Website development | Developer, 4–8 weeks | Payload Expert + DevOps → deployed repo | ✅ Live |
| Copywriting | Copywriter, 2–4 weeks | Content Writer Agent → WrittenCopy | ✅ Live |
| SEO (technical) | SEO specialist | Baked into Next.js build | ✅ Live |
| SEO (on-page) | SEO specialist, monthly | Content Writer + Digital Team agents | ✅ Live |
| Local SEO | SEO specialist | Schema, NAP, location signals in build | ✅ Live |
| Content management | Content manager, ongoing | Digital Team agents via chat | ✅ Live |
| Content marketing / blog | Content team, weekly | AI-written posts (Growth+) | ✅ Live |
| Analytics & reporting | Analyst, monthly | Automated monthly report | 🔵 Phase 2 |
| Email marketing | Email marketer | Transactional done; campaigns Phase 2 | 🔵 Phase 2 |
| Social media management | Social media manager | Content calendar via Digital Team | 🔵 Phase 2 |
| Paid advertising (Google) | PPC specialist | AI-managed Google Ads | 🔵 Phase 3 |
| Paid advertising (Meta) | PPC specialist | AI-managed Meta Ads | 🔵 Phase 3 |
| Reputation management | Account manager | Review monitoring + response agents | 🔵 Phase 3 |
| PR & media relations | PR specialist | Press release generation + distribution | 🔵 Phase 3 |
| Video marketing | Video producer | AI script + stock footage | 🔵 Phase 3 |
| Influencer marketing | Influencer manager | AI identification + outreach | 🔵 Phase 3 |
| CRO (conversion rate) | UX/data specialist | A/B testing via Digital Team | 🔵 Phase 3 |
| Marketing automation | Marketing ops | Trigger-based workflows | 🔵 Phase 3 |

**Legend:** ✅ Live now | 🔵 On roadmap (Phase 2/3)

---

## BMC SUMMARY — ONE SENTENCE PER BLOCK

| Block | One sentence |
|-------|-------------|
| **Customer Segments** | Local service SMEs who need a full digital team but can't afford one, plus small agencies who want to scale delivery without headcount. |
| **Value Propositions** | A permanent AI workforce that builds, manages, and evolves your digital presence as a media entity — from strategy to SEO — and hands you the code unconditionally. |
| **Channels** | fullstp.com, Product Hunt, founder LinkedIn, AI newsletters, chamber talks, and accounting software integrations. |
| **Customer Relationships** | Employment-style: customer briefs the team, team executes, customer owns all work product and can eject anytime. |
| **Revenue Streams** | Monthly SaaS ($99–$499), usage add-ons, white-label/agency reseller fees, and enterprise contracts. |
| **Key Resources** | The Repo OS, the Golden Image boilerplate, 7 specialist AI agents, the Anthropic Claude API, and fullstp.com. |
| **Key Activities** | Running the 9-stage factory pipeline per tenant, operating the Digital Team for ongoing management, and maintaining the Golden Image. |
| **Key Partnerships** | Anthropic (intelligence), Cloudflare (storage/CDN), HestiaCP (hosting), agencies (white-label channel), and accounting software (SME distribution). |
| **Cost Structure** | Primarily variable (Claude API tokens ~$7–17/tenant/month), resulting in 83–97% gross margins depending on tier. |

---

*FullStop BMC v1 — May 2026 — fullstp.com*
*Updated with each phase milestone. This canvas lives at docs/pitch/bmc-fullstp.md*
