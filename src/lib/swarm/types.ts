/**
 * Swarm type definitions for the FullStop Factory Pipeline.
 *
 * Queen/Worker hierarchy:
 *   Queen (CEO)        → strategy, consensus, judges
 *   Design Director    → palette, font, hero variant, page composition (selection task)
 *   Content Writer     → emotionally resonant copy per section per page
 *   UI Architect       → visual arrangement, animation notes, layout (receives copy)
 *   Payload Expert     → database schemas, block configs (FORBIDDEN from styling)
 *   DevOps             → PM2/HestiaCP deployment (no LLM)
 */

// ── Agent Roles ──

export type AgentRole =
  | 'queen'
  | 'design-director'
  | 'content-writer'
  | 'ui-architect'
  | 'payload-expert'
  | 'devops'

export type PipelineStage =
  | 'persist'
  | 'strategy'
  | 'design-brief'
  | 'copywriting'
  | 'design'
  | 'convert'
  | 'consensus'
  | 'deploy'
  | 'seed'

// ── Business Archetype ──
// Determines site structure, navigation, CTAs, content tone, and trust signals.

export type BusinessArchetype =
  | 'product'     // Browse → Buy object (candles, clothing, skincare, furniture)
  | 'service'     // Discover → Engage expert (consulting, law, agency, coaching)
  | 'experience'  // Discover → Book moment (restaurant, spa, hotel, event venue)
  | 'creative'    // Browse → Commission work (photography, design, art, music)
  | 'local'       // Find → Visit place (bakery, salon, gym, retail shop)
  | 'saas'        // Try → Subscribe tool (software, app, platform)

/** Archetype-specific configuration for site structure and content tone. */
export interface ArchetypeConfig {
  /** Page slugs and their display labels */
  pages: { slug: string; label: string; purpose: string }[]
  /** Navigation labels (used in header + footer) */
  navLinks: { label: string; url: string }[]
  /** Primary CTA button in header */
  headerCta: { label: string; url: string }
  /** Hero CTA defaults */
  heroCta: { label: string; link: string }
  /** Hero highlight chips */
  highlights: string[]
  /** Feature grid — product/service-specific values */
  features: { icon: string; title: string; descTemplate: string }[]
  /** Testimonial section heading */
  testimonialHeading: string
  /** Testimonial author roles */
  testimonialRoles: string[]
  /** Closing banner CTA */
  closingCta: { heading: string; description: string; label: string }
  /** Social proof term: "Clients" vs "Customers" vs "Guests" */
  socialProofTerm: string
  /** Heading for homepage feature grid — template with {{name}} */
  featureGridHeading: string
  /** Features for the second page (menu/shop/work/features/offerings) */
  secondPageFeatures: { icon: string; title: string; descTemplate: string }[]
  /** Subheading for second page hero — template with {{name}} */
  secondPageSubheading: string
  /** CTA heading on second page — template with {{name}} */
  secondPageCtaHeading: string
  /** CTA body on second page — template with {{name}} */
  secondPageCtaBody: string
  /** About page hero subheading — template with {{name}} */
  aboutSubheading: string
  /** About page narrative body — multiline template with {{name}} */
  aboutNarrative: string
  /** About page info banner text — template with {{name}} */
  aboutBanner: string
  /** Contact page hero subheading */
  contactSubheading: string
  /** Contact page rich content body (2 paragraphs separated by \n\n) */
  contactBody: string
  /** 3 testimonial quote templates with {{name}} placeholder */
  testimonialQuotes: string[]
}

export const ARCHETYPE_CONFIGS: Record<BusinessArchetype, ArchetypeConfig> = {
  product: {
    pages: [
      { slug: 'home', label: 'Home', purpose: 'Showcase brand + featured products' },
      { slug: 'products', label: 'Shop', purpose: 'Browse product collections' },
      { slug: 'about', label: 'Our Story', purpose: 'Brand origin and values' },
      { slug: 'contact', label: 'Contact', purpose: 'Customer support and inquiries' },
    ],
    navLinks: [
      { label: 'Home', url: '/' }, { label: 'Shop', url: '/products' },
      { label: 'Our Story', url: '/about' }, { label: 'Contact', url: '/contact' },
    ],
    headerCta: { label: 'Shop Now', url: '/products' },
    heroCta: { label: 'Shop the Collection', link: '/products' },
    highlights: ['Handcrafted', 'Sustainably Made', 'Free Shipping'],
    features: [
      { icon: 'leaf', title: 'Natural Materials', descTemplate: 'Made with the finest natural ingredients, sourced responsibly and with care.' },
      { icon: 'heart', title: 'Handcrafted', descTemplate: 'Every piece is made by hand in small batches for exceptional quality.' },
      { icon: 'shield', title: 'Quality Guaranteed', descTemplate: 'We stand behind every product with our satisfaction guarantee.' },
    ],
    testimonialHeading: 'What Our Customers Say',
    testimonialRoles: ['Loyal Customer', 'Repeat Buyer', 'Gift Recipient'],
    closingCta: { heading: 'Find Something You Love', description: 'Explore our full collection and discover your new favorite.', label: 'Browse Collection' },
    socialProofTerm: 'customers',
    featureGridHeading: 'Why You\'ll Love {{name}}',
    secondPageFeatures: [
      { icon: 'search', title: 'Browse Collections', descTemplate: 'Explore our curated collections, each designed with intention and care.' },
      { icon: 'star', title: 'Customer Favorites', descTemplate: 'Discover the products our customers can\'t stop raving about.' },
      { icon: 'gift', title: 'Perfect for Gifting', descTemplate: 'Beautifully packaged and ready to delight someone special.' },
      { icon: 'truck', title: 'Fast, Free Shipping', descTemplate: 'Free shipping on all orders — delivered to your door with care.' },
    ],
    secondPageSubheading: 'Browse our full collection — each piece crafted with care and intention.',
    secondPageCtaHeading: 'Find Your Perfect Match',
    secondPageCtaBody: 'Not sure where to start? We\'re happy to help you find exactly what you\'re looking for.',
    aboutSubheading: 'The story behind the products you love — and the people who make them.',
    aboutNarrative: '{{name}} started with a simple idea: that beautiful, thoughtfully made products should be accessible to everyone.\n\nEvery piece in our collection is crafted with care — from sourcing the finest materials to the final quality check before it reaches your hands. We believe in slow, intentional creation over mass production.\n\nWhat began as a small passion project has grown into something we\'re incredibly proud of — and we\'re just getting started.',
    aboutBanner: 'Every {{name}} product comes with our quality guarantee. Love it or we\'ll make it right.',
    contactSubheading: 'Questions about an order, a product, or just want to say hi? We\'d love to hear from you.',
    contactBody: 'Our team typically responds within a few hours during business days.\n\nWhether it\'s a question about sizing, materials, shipping, or something else entirely — don\'t hesitate to reach out.',
    testimonialQuotes: [
      'The quality of {{name}} products is incredible. I\'ve ordered three times now and every piece has been perfect.',
      'I bought this as a gift and my friend absolutely loved it. The packaging was beautiful too. Already planning my next order.',
      'I\'ve been looking for something exactly like this. {{name}} nailed it — the craftsmanship is outstanding.',
    ],
  },
  service: {
    pages: [
      { slug: 'home', label: 'Home', purpose: 'Establish expertise and trust' },
      { slug: 'services', label: 'Services', purpose: 'Detail service offerings' },
      { slug: 'about', label: 'About', purpose: 'Team credibility and story' },
      { slug: 'contact', label: 'Contact', purpose: 'Consultation booking' },
    ],
    navLinks: [
      { label: 'Home', url: '/' }, { label: 'Services', url: '/services' },
      { label: 'About', url: '/about' }, { label: 'Contact', url: '/contact' },
    ],
    headerCta: { label: 'Get Started', url: '/contact' },
    heroCta: { label: 'Get Started', link: '/contact' },
    highlights: ['Expert Team', 'Proven Results', 'Client Focused'],
    features: [
      { icon: 'star', title: 'Excellence', descTemplate: 'Dedicated to delivering exceptional results that exceed expectations.' },
      { icon: 'heart', title: 'Passion', descTemplate: 'Every project is crafted with care and attention to detail by our expert team.' },
      { icon: 'shield', title: 'Trust', descTemplate: 'Building lasting relationships through transparency, reliability, and consistent quality.' },
    ],
    testimonialHeading: 'What Our Clients Say',
    testimonialRoles: ['Business Owner', 'Operations Director', 'Founder'],
    closingCta: { heading: "Let's Build Something Great Together", description: "Whether you're just getting started or looking to elevate what you have, we're here to help you succeed.", label: 'Get in Touch' },
    socialProofTerm: 'clients',
    featureGridHeading: 'Why Clients Choose {{name}}',
    secondPageFeatures: [
      { icon: 'briefcase', title: 'Strategy & Consulting', descTemplate: 'Deep expertise to guide your decisions and accelerate growth.' },
      { icon: 'layers', title: 'End-to-End Delivery', descTemplate: 'From planning to execution, we handle every detail so you don\'t have to.' },
      { icon: 'refresh-cw', title: 'Ongoing Support', descTemplate: 'We don\'t disappear after launch — continuous support and optimization.' },
      { icon: 'bar-chart', title: 'Measurable Results', descTemplate: 'Clear metrics and transparent reporting so you always know the impact.' },
    ],
    secondPageSubheading: 'Tailored solutions designed to move your business forward.',
    secondPageCtaHeading: 'Ready to Get Started?',
    secondPageCtaBody: 'Let\'s talk about your goals and how we can help you achieve them.',
    aboutSubheading: 'A team of experts dedicated to helping businesses like yours thrive.',
    aboutNarrative: '{{name}} was founded with a clear mission: to deliver results that matter. We\'ve built our reputation on deep expertise, honest partnerships, and a relentless focus on outcomes.\n\nOur team brings together years of experience across industries. We don\'t believe in one-size-fits-all — every engagement is tailored to your unique challenges and opportunities.\n\nWe measure our success by yours. When you grow, we grow.',
    aboutBanner: 'Ready to see what {{name}} can do for your business? Let\'s start with a conversation.',
    contactSubheading: 'Tell us about your project and we\'ll get back to you within one business day.',
    contactBody: 'Whether you\'re starting something new or looking to level up what you have, we\'re here to help.\n\nFill out the form below with a few details about your project, and a member of our team will be in touch shortly.',
    testimonialQuotes: [
      '{{name}} transformed how we approach our business. Their strategic thinking and execution are top-notch.',
      'Working with {{name}} was a game-changer. They delivered exactly what they promised — and then some.',
      'I\'ve worked with a lot of agencies, but {{name}} stands apart. They genuinely care about results.',
    ],
  },
  experience: {
    pages: [
      { slug: 'home', label: 'Home', purpose: 'Create atmosphere and desire to visit' },
      { slug: 'menu', label: 'Menu', purpose: 'Showcase offerings and ambiance' },
      { slug: 'about', label: 'About', purpose: 'Origin story and philosophy' },
      { slug: 'contact', label: 'Visit', purpose: 'Reservations and location' },
    ],
    navLinks: [
      { label: 'Home', url: '/' }, { label: 'Menu', url: '/menu' },
      { label: 'About', url: '/about' }, { label: 'Contact', url: '/contact' },
    ],
    headerCta: { label: 'Reserve Now', url: '/contact' },
    heroCta: { label: 'Make a Reservation', link: '/contact' },
    highlights: ['Fresh Daily', 'Locally Sourced', 'Award Winning'],
    features: [
      { icon: 'sparkles', title: 'Fresh Ingredients', descTemplate: 'Every dish crafted from the finest seasonal and locally sourced ingredients.' },
      { icon: 'heart', title: 'Made with Love', descTemplate: 'Recipes perfected over years, served with genuine hospitality.' },
      { icon: 'clock', title: 'Perfect Timing', descTemplate: 'From preparation to presentation, every detail is carefully considered.' },
    ],
    testimonialHeading: 'Guest Reviews',
    testimonialRoles: ['Regular Guest', 'Food Enthusiast', 'First-Time Visitor'],
    closingCta: { heading: 'Join Us for an Unforgettable Experience', description: 'Reserve your table and let us take care of the rest.', label: 'Make a Reservation' },
    socialProofTerm: 'guests',
    featureGridHeading: 'The {{name}} Experience',
    secondPageFeatures: [
      { icon: 'flame', title: 'Signature Dishes', descTemplate: 'Time-honored recipes made with the freshest ingredients, prepared with passion.' },
      { icon: 'wine', title: 'Curated Pairings', descTemplate: 'Thoughtfully selected wines and drinks to complement every course.' },
      { icon: 'calendar', title: 'Private Events', descTemplate: 'Host your next celebration in our warm, intimate dining space.' },
      { icon: 'sparkles', title: 'Seasonal Specials', descTemplate: 'New dishes that celebrate the best of each season, available for a limited time.' },
    ],
    secondPageSubheading: 'Every dish tells a story — explore what\'s waiting for you at {{name}}.',
    secondPageCtaHeading: 'Your Table Is Waiting',
    secondPageCtaBody: 'Join us for an evening you won\'t forget. Reserve your spot today.',
    aboutSubheading: 'How a love of great food and warm company became {{name}}.',
    aboutNarrative: '{{name}} was born from a simple belief: that a great meal is about so much more than food. It\'s about the warmth of the room, the laughter at the table, and the feeling of being truly welcome.\n\nOur recipes have been passed down and perfected over generations. Every ingredient is chosen with care, every dish prepared with intention. We don\'t rush — because the best things take time.\n\nWhen you walk through our doors, you\'re not just a guest. You\'re family.',
    aboutBanner: 'Reservations recommended for weekend evenings. Walk-ins always welcome when space allows.',
    contactSubheading: 'Make a reservation, ask about private events, or just let us know you\'re coming.',
    contactBody: 'We\'d love to welcome you to our table. Reservations are recommended for dinner, especially on weekends.\n\nFor private events, large parties, or special requests, please include details in your message and we\'ll get back to you within the day.',
    testimonialQuotes: [
      'Every time I walk into {{name}}, I feel like I\'m coming home. The food is incredible and the atmosphere is even better.',
      'We celebrated our anniversary here and it was perfect. The staff made us feel so special — we\'ll be back every year.',
      'I brought friends visiting from out of town to {{name}} and they couldn\'t stop talking about it. This place is the real deal.',
    ],
  },
  creative: {
    pages: [
      { slug: 'home', label: 'Home', purpose: 'Showcase best work and creative vision' },
      { slug: 'work', label: 'Work', purpose: 'Portfolio of projects and case studies' },
      { slug: 'about', label: 'About', purpose: 'Creative philosophy and process' },
      { slug: 'contact', label: 'Hire Me', purpose: 'Project inquiries and collaboration' },
    ],
    navLinks: [
      { label: 'Home', url: '/' }, { label: 'Work', url: '/work' },
      { label: 'About', url: '/about' }, { label: 'Contact', url: '/contact' },
    ],
    headerCta: { label: 'View Work', url: '/work' },
    heroCta: { label: 'See Our Work', link: '/work' },
    highlights: ['Award Winning', 'Featured in Press', 'Global Clients'],
    features: [
      { icon: 'sparkles', title: 'Creative Vision', descTemplate: 'Bold ideas brought to life with craft, intention, and attention to every detail.' },
      { icon: 'target', title: 'Strategic Thinking', descTemplate: 'Design that serves a purpose — beautiful AND effective.' },
      { icon: 'zap', title: 'Fast Turnaround', descTemplate: 'From concept to delivery, we move quickly without cutting corners.' },
    ],
    testimonialHeading: 'Client Stories',
    testimonialRoles: ['Brand Director', 'Marketing Lead', 'Startup Founder'],
    closingCta: { heading: "Let's Create Something Remarkable", description: "Have a project in mind? We'd love to hear about it.", label: 'Start a Conversation' },
    socialProofTerm: 'clients',
    featureGridHeading: 'Our Approach',
    secondPageFeatures: [
      { icon: 'palette', title: 'Brand Identity', descTemplate: 'Logos, color systems, and visual languages that make your brand unmistakable.' },
      { icon: 'layout', title: 'Web & Digital', descTemplate: 'Websites and digital experiences that are beautiful, functional, and fast.' },
      { icon: 'camera', title: 'Photography & Video', descTemplate: 'Visual storytelling that captures attention and communicates your brand.' },
      { icon: 'pen-tool', title: 'Print & Packaging', descTemplate: 'Tactile design that makes a lasting impression, from business cards to packaging.' },
    ],
    secondPageSubheading: 'Selected projects that showcase our range and creative thinking.',
    secondPageCtaHeading: 'Have a Project in Mind?',
    secondPageCtaBody: 'We\'d love to hear about what you\'re working on. Let\'s make something great together.',
    aboutSubheading: 'The philosophy, process, and people behind the work.',
    aboutNarrative: '{{name}} exists at the intersection of strategy and beauty. We believe design should do more than look good — it should move people, solve problems, and create lasting value.\n\nOur process starts with listening. We dig deep to understand your brand, your audience, and what makes you different. Then we create work that amplifies that difference.\n\nEvery project is a collaboration. We bring the craft — you bring the vision.',
    aboutBanner: 'Currently accepting new projects for next quarter. Get in touch to discuss availability.',
    contactSubheading: 'Tell us about your project and let\'s explore what we can create together.',
    contactBody: 'We take on a limited number of projects to ensure every client gets our full attention and best work.\n\nShare some details about your project, timeline, and budget range, and we\'ll set up a discovery call to see if we\'re a good fit.',
    testimonialQuotes: [
      '{{name}} completely reimagined our brand and the results speak for themselves. Our customers notice the difference.',
      'The team at {{name}} is incredibly talented and collaborative. They turned our vague ideas into something stunning.',
      'Working with {{name}} was effortless. They understood our vision immediately and elevated it beyond what we imagined.',
    ],
  },
  local: {
    pages: [
      { slug: 'home', label: 'Home', purpose: 'Welcome and orient local visitors' },
      { slug: 'offerings', label: 'What We Offer', purpose: 'Products/services and pricing' },
      { slug: 'about', label: 'About', purpose: 'Community roots and story' },
      { slug: 'contact', label: 'Visit Us', purpose: 'Location, hours, and booking' },
    ],
    navLinks: [
      { label: 'Home', url: '/' }, { label: 'What We Offer', url: '/offerings' },
      { label: 'About', url: '/about' }, { label: 'Contact', url: '/contact' },
    ],
    headerCta: { label: 'Visit Us', url: '/contact' },
    heroCta: { label: 'Come Say Hello', link: '/contact' },
    highlights: ['Family Owned', 'Community Favorite', 'Open Daily'],
    features: [
      { icon: 'heart', title: 'Community First', descTemplate: 'Rooted in the neighborhood, serving the people who make it special.' },
      { icon: 'star', title: 'Quality Always', descTemplate: 'No shortcuts, no compromises — just honest quality you can count on.' },
      { icon: 'users', title: 'Friendly Faces', descTemplate: 'A warm welcome every time you walk through our doors.' },
    ],
    testimonialHeading: 'From the Community',
    testimonialRoles: ['Neighbor', 'Regular', 'Local Favorite'],
    closingCta: { heading: 'We Can\'t Wait to See You', description: 'Stop by anytime — we\'re right in the heart of the neighborhood.', label: 'Get Directions' },
    socialProofTerm: 'neighbors',
    featureGridHeading: 'What Makes {{name}} Special',
    secondPageFeatures: [
      { icon: 'map-pin', title: 'Right in Your Neighborhood', descTemplate: 'Conveniently located and easy to find — we\'re just around the corner.' },
      { icon: 'clock', title: 'Flexible Hours', descTemplate: 'Open when you need us, with hours designed around your schedule.' },
      { icon: 'smile', title: 'Friendly Service', descTemplate: 'Every visit starts with a warm welcome and a genuine smile.' },
      { icon: 'award', title: 'Local Favorite', descTemplate: 'Trusted by the community and proud to be part of the neighborhood.' },
    ],
    secondPageSubheading: 'Everything we offer, all in one place — stop by anytime.',
    secondPageCtaHeading: 'Come See Us',
    secondPageCtaBody: 'We\'re right in the heart of the neighborhood and we\'d love to see you.',
    aboutSubheading: 'A neighborhood staple built on community, quality, and a lot of heart.',
    aboutNarrative: '{{name}} has been part of this community since day one. What started small has grown into something we\'re proud of — but we\'ve never lost sight of what matters most: the people who walk through our doors.\n\nWe believe in doing things right. Quality products, fair prices, and genuine connections with every person we serve.\n\nThis neighborhood is home. And we\'re honored to be a part of it.',
    aboutBanner: 'Stop by during business hours — no appointment needed. We\'re always happy to help.',
    contactSubheading: 'Find us, visit us, or drop us a line — we\'re always happy to hear from you.',
    contactBody: 'We\'re located right in the heart of the neighborhood. Stop by anytime during business hours — no appointment needed.\n\nHave a question or want to check availability? Send us a message below and we\'ll get back to you quickly.',
    testimonialQuotes: [
      'I love that {{name}} is right in my neighborhood. The quality is amazing and the people are wonderful.',
      '{{name}} is our go-to spot. Friendly staff, great selection, and they always remember our name.',
      'We moved to this neighborhood two years ago and {{name}} was one of the first places we discovered. We\'ve been regulars ever since.',
    ],
  },
  saas: {
    pages: [
      { slug: 'home', label: 'Home', purpose: 'Hook with value prop and social proof' },
      { slug: 'features', label: 'Features', purpose: 'Detailed feature breakdown' },
      { slug: 'about', label: 'About', purpose: 'Team and mission' },
      { slug: 'contact', label: 'Get Started', purpose: 'Sign up or demo request' },
    ],
    navLinks: [
      { label: 'Home', url: '/' }, { label: 'Features', url: '/features' },
      { label: 'About', url: '/about' }, { label: 'Contact', url: '/contact' },
    ],
    headerCta: { label: 'Start Free', url: '/contact' },
    heroCta: { label: 'Start Free Trial', link: '/contact' },
    highlights: ['No Credit Card', 'Free 14-Day Trial', 'Cancel Anytime'],
    features: [
      { icon: 'zap', title: 'Lightning Fast', descTemplate: 'Built for speed — load times measured in milliseconds, not seconds.' },
      { icon: 'shield', title: 'Enterprise Security', descTemplate: 'Bank-grade encryption and compliance built into every layer.' },
      { icon: 'globe', title: 'Works Everywhere', descTemplate: 'Cloud-native and accessible from any device, anywhere in the world.' },
    ],
    testimonialHeading: 'Trusted by Teams Everywhere',
    testimonialRoles: ['CTO', 'Product Manager', 'Engineering Lead'],
    closingCta: { heading: 'Ready to Get Started?', description: 'Join thousands of teams already using our platform.', label: 'Start Your Free Trial' },
    socialProofTerm: 'teams',
    featureGridHeading: 'Why Teams Choose {{name}}',
    secondPageFeatures: [
      { icon: 'zap', title: 'Lightning Fast', descTemplate: 'Built for speed — no lag, no loading screens, just instant results.' },
      { icon: 'lock', title: 'Enterprise Security', descTemplate: 'Bank-grade encryption and SOC 2 compliance to keep your data safe.' },
      { icon: 'plug', title: 'Powerful Integrations', descTemplate: 'Connect with the tools you already use — Slack, Zapier, and 100+ more.' },
      { icon: 'trending-up', title: 'Built to Scale', descTemplate: 'From startup to enterprise — grows with you without missing a beat.' },
    ],
    secondPageSubheading: 'Everything you need to work smarter, all in one platform.',
    secondPageCtaHeading: 'Ready to Try {{name}}?',
    secondPageCtaBody: 'Start your free trial today. No credit card required — cancel anytime.',
    aboutSubheading: 'The team and mission behind the product.',
    aboutNarrative: '{{name}} was built by a team that was tired of clunky, overpriced software that promised everything and delivered frustration. We knew there had to be a better way.\n\nSo we built it. Simple, powerful, and designed around how people actually work. No bloat, no learning curve — just the tools you need to get things done.\n\nToday, thousands of teams rely on {{name}} every day. And we\'re just getting started.',
    aboutBanner: 'Join thousands of teams already using {{name}}. Start your free trial today.',
    contactSubheading: 'Questions, feedback, or ready to get started? We\'re here to help.',
    contactBody: 'Our team is available Monday through Friday and we typically respond within a few hours.\n\nWhether you need help getting set up, have a feature request, or want to discuss enterprise pricing — we\'d love to hear from you.',
    testimonialQuotes: [
      '{{name}} replaced three tools we were using. It\'s faster, simpler, and our whole team actually enjoys using it.',
      'We evaluated a dozen options and {{name}} was the clear winner. Setup took 10 minutes and we haven\'t looked back.',
      'The team behind {{name}} is incredibly responsive. They shipped a feature we requested within two weeks.',
    ],
  },
}

// ── Section / Block Types ──

export type SectionType =
  | 'hero'
  | 'brandNarrative'
  | 'featureGrid'
  | 'testimonials'
  | 'mediaBlock'
  | 'content'
  | 'cta'
  | 'closingBanner'
  | 'banner'
  | 'formBlock'

// ── BMC (input from Strategy phase) ──

export interface BMC {
  businessName: string
  industry: string
  tagline?: string
  targetSegments?: string[]
  valueProposition?: string
  blocks?: string[]
  brandMood?: string
  businessArchetype?: BusinessArchetype
}

// ── Queen: Strategy Brief ──

export interface StrategyBrief {
  businessName: string
  industry: string
  targetAudience: string
  brandVoice: string
  messagingPillars: string[]
  pageIntents: { slug: string; purpose: string }[]
  businessArchetype?: BusinessArchetype
}

// ── Design Director: Design Brief ──

export interface DesignBrief {
  heroVariant: 'highImpact' | 'mediumImpact' | 'lowImpact'
  palette: 'midnight' | 'ocean' | 'forest' | 'sunset' | 'lavender' | 'ember'
  fontPairing: 'geist-inter' | 'playfair-sourcesans' | 'playfair-inter' | 'dmsans-dmserif' | 'spacegrotesk-inter'
  borderRadius: 'none' | 'sm' | 'md' | 'lg'
  pagePresets?: Record<string, string>
  /** @deprecated Use pagePresets instead. Kept for backward compat with in-flight deploys. */
  pageLayouts?: {
    slug: string
    blockSequence: SectionType[]
  }[]
}

// ── Content Writer: Written Copy ──

export interface WrittenCopy {
  pages: {
    slug: string
    sections: {
      type: SectionType
      heading: string
      body?: string
      subheading?: string
      badge?: string
      eyebrow?: string
      ctaText?: string
      ctaLink?: string
      highlights?: string[]
      features?: { icon: string; title: string; description: string }[]
      testimonials?: { quote: string; author: string; role: string }[]
    }[]
  }[]
}

// ── UI Architect: Frontend Design ──

export interface FrontendSection {
  type: SectionType
  heading: string
  body?: string
  subheading?: string
  badge?: string
  eyebrow?: string
  ctaText?: string
  ctaLink?: string
  visualNotes?: string
  highlights?: string[]
  features?: { icon: string; title: string; description: string }[]
  testimonials?: { quote: string; author: string; role: string }[]
}

export interface FrontendDesign {
  pages: {
    slug: string
    title: string
    sections: FrontendSection[]
  }[]
  brandTokens: {
    mood: string
    colorIntent: string
    typography: string
  }
}

// ── Payload Expert: Content Package ──

export interface ContentPackage {
  pages: {
    title: string
    slug: string
    layout: Record<string, unknown>[]
  }[]
  globals: {
    siteSettings: {
      siteName: string
      siteDescription: string
      theme?: {
        palette?: string
        fontPairing?: string
        borderRadius?: string
      }
    }
    header: {
      navLinks: { label: string; url: string }[]
      brandLabel?: string
      ctaButton?: { label: string; url: string }
    }
    footer: {
      footerLinks: { label: string; url: string }[]
      copyright: string
      description?: string
      copyrightName?: string
      socialLinks?: { platform: string; url: string }[]
      phone?: string
      address?: string
      businessHours?: string
      mapLink?: string
      bottomMessage?: string
    }
  }
}

/** Lightweight consensus artifact — structure only, no content values. */
export interface ContentSchemaMap {
  pages: {
    slug: string
    blockTypes: string[]
    fieldKeys: string[][]
  }[]
  globalsPresent: string[]
}

// ── Queen: Consensus ──

export interface ConsensusResult {
  aligned: boolean
  mismatches: string[]
  corrections: string[]
}

// ── Shared Memory ──

export interface SharedMemoryEntry {
  key: string
  value: unknown
  setBy: AgentRole
  timestamp: number
}

export interface SwarmEvent {
  stage: PipelineStage
  agent: AgentRole
  message: string
  status: 'running' | 'done' | 'error'
  timestamp: number
}

// ── Logging ──

export type LogFn = (
  agent: string,
  text: string,
  status: 'running' | 'done' | 'error'
) => void
