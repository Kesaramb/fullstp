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
  | 'healthcare'  // Trust → Book appointment (hospital, clinic, dental, vet, physio, mental health, wellness clinic)
  | 'civic'       // Join → Donate/Volunteer (nonprofit, foundation, community org, Rotary, club, charity)
  | 'education'   // Apply → Enrol (school, training program, course, bootcamp, academy)

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
  healthcare: {
    pages: [
      { slug: 'home', label: 'Home', purpose: 'Establish trust and clinical credibility' },
      { slug: 'services', label: 'Services', purpose: 'Detail treatments, specialties, and care offered' },
      { slug: 'our-team', label: 'Our Team', purpose: 'Credentials, specialties, and clinician profiles' },
      { slug: 'contact', label: 'Contact', purpose: 'Appointment booking, location, hours' },
    ],
    navLinks: [
      { label: 'Home', url: '/' }, { label: 'Services', url: '/services' },
      { label: 'Our Team', url: '/our-team' }, { label: 'Contact', url: '/contact' },
    ],
    headerCta: { label: 'Book Appointment', url: '/contact' },
    heroCta: { label: 'Book a Consultation', link: '/contact' },
    highlights: ['Board-Certified', 'Patient-First Care', 'Years of Experience'],
    features: [
      { icon: 'heart', title: 'Compassionate Care', descTemplate: 'Every patient is treated with empathy, dignity, and individual attention from the moment they arrive.' },
      { icon: 'shield', title: 'Specialist Expertise', descTemplate: 'Board-certified clinicians with deep experience across specialties, committed to evidence-based care.' },
      { icon: 'check', title: 'Trusted Outcomes', descTemplate: 'A track record of patient satisfaction, transparent communication, and clear treatment outcomes.' },
    ],
    testimonialHeading: 'Patient Stories',
    testimonialRoles: ['Patient', 'Family Member', 'Referring Physician'],
    closingCta: { heading: 'Take the First Step Toward Better Care', description: 'Our team is here to listen, answer your questions, and guide you through every step.', label: 'Book Your Appointment' },
    socialProofTerm: 'patients',
    featureGridHeading: 'Why Patients Choose {{name}}',
    secondPageFeatures: [
      { icon: 'stethoscope', title: 'Comprehensive Care', descTemplate: 'A full range of services delivered under one roof, coordinated for clarity and continuity.' },
      { icon: 'users', title: 'Team-Based Approach', descTemplate: 'Specialists, nurses, and care coordinators working together on your treatment plan.' },
      { icon: 'clock', title: 'Convenient Scheduling', descTemplate: 'Flexible appointment times, telehealth options, and same-week availability for most concerns.' },
      { icon: 'shield', title: 'Trusted Standards', descTemplate: 'Accredited facility with rigorous safety protocols and ongoing clinical quality programs.' },
    ],
    secondPageSubheading: 'Explore the full range of care we provide — from preventive visits to specialized treatment.',
    secondPageCtaHeading: 'Not Sure Where to Start?',
    secondPageCtaBody: 'Our care coordinators can help you find the right service and clinician for your needs.',
    aboutSubheading: 'Meet the clinicians and staff dedicated to your care at {{name}}.',
    aboutNarrative: 'At {{name}}, we believe that excellent care begins with listening. Every clinician on our team is committed to understanding your concerns before recommending a path forward.\n\nOur team brings decades of combined experience, ongoing specialty training, and a shared commitment to evidence-based medicine. We coordinate closely across specialties so that your care is consistent, communicative, and centered on you.\n\nWhether you\'re visiting for a routine check-up or navigating a complex condition, you\'ll find a team that treats you as a partner, not a case number.',
    aboutBanner: 'Every clinician at {{name}} is board-certified and committed to ongoing professional development.',
    contactSubheading: 'Book an appointment, request a referral, or ask a question — we typically respond within one business day.',
    contactBody: 'For appointments, please use the form below or call us directly during business hours. For urgent medical concerns outside business hours, please contact your local emergency service.\n\nWe accept most major insurance plans and offer transparent pricing for self-pay patients. Our team can help verify your coverage and discuss payment options before your visit.',
    testimonialQuotes: [
      'The team at {{name}} took the time to explain everything clearly and made me feel genuinely cared for. I won\'t go anywhere else.',
      'After years of being shuffled between specialists, finding {{name}} was a relief. They listened, coordinated my care, and got me on the right path.',
      'I refer my patients to {{name}} with complete confidence. Their clinical standards and patient communication are exceptional.',
    ],
  },
  civic: {
    pages: [
      { slug: 'home', label: 'Home', purpose: 'Mission, impact, and how to participate' },
      { slug: 'our-work', label: 'Our Work', purpose: 'Programs, initiatives, and community impact' },
      { slug: 'events', label: 'Events', purpose: 'Upcoming gatherings, fundraisers, volunteer days' },
      { slug: 'get-involved', label: 'Get Involved', purpose: 'Donate, volunteer, become a member' },
    ],
    navLinks: [
      { label: 'Home', url: '/' }, { label: 'Our Work', url: '/our-work' },
      { label: 'Events', url: '/events' }, { label: 'Get Involved', url: '/get-involved' },
    ],
    headerCta: { label: 'Get Involved', url: '/get-involved' },
    heroCta: { label: 'Join Us', link: '/get-involved' },
    highlights: ['Community-Led', 'Volunteer Driven', 'Mission Focused'],
    features: [
      { icon: 'heart', title: 'Our Mission', descTemplate: 'A clear purpose that guides every program, every event, and every dollar we put to work in the community.' },
      { icon: 'users', title: 'Community Impact', descTemplate: 'Measurable change in the lives of the people we serve — reported transparently every year.' },
      { icon: 'hand', title: 'Open to All', descTemplate: 'Members, volunteers, and partners from every background united by a shared commitment to service.' },
    ],
    testimonialHeading: 'Stories from Our Community',
    testimonialRoles: ['Volunteer', 'Member', 'Beneficiary'],
    closingCta: { heading: 'Join Us in Making a Difference', description: 'Whether you have an hour, a skill, or a story to share — there\'s a way to get involved at {{name}}.', label: 'Find Your Way to Help' },
    socialProofTerm: 'members',
    featureGridHeading: 'How {{name}} Works',
    secondPageFeatures: [
      { icon: 'leaf', title: 'Ongoing Programs', descTemplate: 'Long-term initiatives delivering consistent support and measurable outcomes year-round.' },
      { icon: 'calendar', title: 'Community Events', descTemplate: 'Public gatherings, fundraisers, and volunteer days open to members and visitors alike.' },
      { icon: 'gift', title: 'Direct Giving', descTemplate: 'Targeted campaigns where every contribution maps directly to a program or beneficiary.' },
      { icon: 'star', title: 'Partnerships', descTemplate: 'Collaborations with local businesses, schools, and other organizations amplifying our impact.' },
    ],
    secondPageSubheading: 'Explore the programs and initiatives that {{name}} runs to serve our community.',
    secondPageCtaHeading: 'Support What Matters to You',
    secondPageCtaBody: 'Pick the program or initiative that speaks to you — every contribution, large or small, makes a real difference.',
    aboutSubheading: 'The story, the people, and the purpose behind {{name}}.',
    aboutNarrative: '{{name}} was founded on a simple belief: that strong communities are built by people who show up for one another. From our first meeting to today, that principle has shaped every program we run and every partnership we build.\n\nWe\'re a member-led organization, which means every initiative starts with a community need and a volunteer willing to take it on. Our leadership rotates, our books are open, and our impact reports are public.\n\nWhether you join us as a donor, a volunteer, or a beneficiary, you become part of a community that\'s been showing up for one another year after year.',
    aboutBanner: '{{name}} publishes annual impact and financial reports — transparency is non-negotiable for us.',
    contactSubheading: 'Reach out about joining, volunteering, partnering, or supporting our work — we\'d love to hear from you.',
    contactBody: 'Whether you want to become a member, organize an event, propose a partnership, or just ask a question — we read every message and respond personally within a few days.\n\nFor donation inquiries, planned giving, or major partnerships, please mention that in your message so we can route you to the right person.',
    testimonialQuotes: [
      'Volunteering with {{name}} has been one of the most meaningful things I\'ve ever done. The community here is genuine and the work matters.',
      'My family has been members of {{name}} for three generations. They\'ve never lost sight of why they started, and our community is better for it.',
      'When our family was going through a hard time, {{name}} was there. No bureaucracy, no judgement — just real support when we needed it.',
    ],
  },
  education: {
    pages: [
      { slug: 'home', label: 'Home', purpose: 'Mission, outcomes, and what makes the program distinct' },
      { slug: 'programs', label: 'Programs', purpose: 'Courses, tracks, curriculum overview' },
      { slug: 'faculty', label: 'Faculty', purpose: 'Instructors, advisors, and their credentials' },
      { slug: 'contact', label: 'Contact', purpose: 'Admissions inquiries, information requests' },
    ],
    navLinks: [
      { label: 'Home', url: '/' }, { label: 'Programs', url: '/programs' },
      { label: 'Faculty', url: '/faculty' }, { label: 'Contact', url: '/contact' },
    ],
    headerCta: { label: 'Apply Now', url: '/contact' },
    heroCta: { label: 'Request Information', link: '/contact' },
    highlights: ['Award-Winning Faculty', 'Proven Outcomes', 'Industry Partnerships'],
    features: [
      { icon: 'star', title: 'World-Class Faculty', descTemplate: 'Instructors who are recognized practitioners and educators, bringing real-world experience into every class.' },
      { icon: 'check', title: 'Hands-On Curriculum', descTemplate: 'A learn-by-doing approach with projects, case studies, and applied work woven through every program.' },
      { icon: 'trending-up', title: 'Career Outcomes', descTemplate: 'Graduates land roles at top organizations, supported by our career services and alumni network.' },
    ],
    testimonialHeading: 'What Our Students Say',
    testimonialRoles: ['Graduate', 'Current Student', 'Industry Partner'],
    closingCta: { heading: 'Take the Next Step in Your Journey', description: 'Speak with our admissions team to explore programs, ask questions, and find the right fit for your goals.', label: 'Start Your Application' },
    socialProofTerm: 'students',
    featureGridHeading: 'Why Choose {{name}}',
    secondPageFeatures: [
      { icon: 'book', title: 'Structured Curriculum', descTemplate: 'Carefully sequenced courses that build skill on skill, from foundations to advanced practice.' },
      { icon: 'users', title: 'Small Cohorts', descTemplate: 'Intentional class sizes that prioritize discussion, mentorship, and individual feedback.' },
      { icon: 'briefcase', title: 'Industry-Connected', descTemplate: 'Guest speakers, internships, and capstone partnerships with leading organizations in your field.' },
      { icon: 'award', title: 'Recognized Credentials', descTemplate: 'Degrees and certifications that employers know and value.' },
    ],
    secondPageSubheading: 'Browse the programs we offer — full curriculum, faculty, and outcomes available for each.',
    secondPageCtaHeading: 'Find the Right Program for You',
    secondPageCtaBody: 'Our admissions advisors can help you compare programs, understand prerequisites, and plan your application.',
    aboutSubheading: 'Meet the educators and staff shaping the {{name}} experience.',
    aboutNarrative: '{{name}} was built on the conviction that great education changes lives — and that meaningful change requires great teachers, well-designed curriculum, and a community that pushes you forward.\n\nOur faculty are practitioners as much as they are educators. They bring current, working knowledge from their fields directly into the classroom, and they invest deeply in the success of every student.\n\nFrom the first week to graduation day, you\'ll find a community of peers, mentors, and alumni committed to helping each other grow — academically, professionally, and personally.',
    aboutBanner: 'Our graduates work in leading organizations across {{name}}\'s field of focus.',
    contactSubheading: 'Questions about programs, admissions, or visiting campus? Our admissions team is here to help.',
    contactBody: 'We respond to every inquiry within one business day. Our admissions advisors can walk you through programs, eligibility, financial aid, and application timelines.\n\nIf you\'d like to attend an open day, schedule a virtual info session, or speak with a current student, just mention it in your message and we\'ll set it up.',
    testimonialQuotes: [
      '{{name}} changed how I think about my field. The faculty pushed me, the cohort challenged me, and I left with skills and a network I rely on every day.',
      'I looked at half a dozen programs before choosing {{name}}. The curriculum was the strongest, the faculty were the most accessible, and the outcomes spoke for themselves.',
      'We\'ve hired multiple {{name}} graduates and they\'re consistently among our strongest team members. Their preparation is real and it shows.',
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
  // PR4 — new conversion + credibility blocks
  | 'stats'
  | 'faq'
  | 'logoCloud'
  | 'pricing'
  | 'process'
  | 'pullQuote'
  | 'callToAction'
  | 'richContent'
  // PR-Industry-Blocks
  | 'serviceCalculator'
  | 'brandTimeline'
  | 'eventCalendarTeaser'
  | 'locationMap'
  | 'menuPreview'
  | 'openingHoursWidget'
  | 'reservationWidget'
  // PR-Commerce — live catalog grid backed by the tenant Products collection
  | 'productGrid'

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
  // Logo + extracted brand palette — customer-uploaded, used to override
  // the mood-derived palette in the design pipeline.
  logoUrl?: string
  logoColors?: {
    primary: string
    secondary: string
    accent: string
    description?: string
  }
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
  heroVariant: 'highImpact' | 'mediumImpact' | 'lowImpact' | 'editorialAsymmetric' | 'bentoSplit' | 'gradientMeshSpotlight' | 'bentoCanvas' | 'agentInteractive' | 'spotlightStage' | 'textRevealCanvas' | 'cinemaImmersive'
  palette: 'midnight' | 'ocean' | 'forest' | 'sunset' | 'lavender' | 'ember' | 'charcoal' | 'cream' | 'sage' | 'cobalt' | 'terracotta' | 'slate' | 'noir' | 'bloom' | 'obsidian' | 'onyx'
  fontPairing: 'geist-inter' | 'playfair-sourcesans' | 'playfair-inter' | 'dmsans-dmserif' | 'spacegrotesk-inter' | 'fraunces-inter' | 'instrumentserif-inter' | 'archivo-archivo' | 'cormorant-jost'
  borderRadius: 'none' | 'sm' | 'md' | 'lg'
  /**
   * PR2: design mood — when set, the dynamic preset compiler is used instead
   * of static preset JSONs. Mood implies a coherent set of block-variant
   * choices across the whole site (Hero, FeatureGrid).
   */
  mood?: 'editorial-luxe' | 'bento-modular' | 'brutalist-bold' | 'glass-spatial' | 'warm-artisan' | 'motion-narrative' | 'cinema-immersive' | 'clean-editorial'
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
      // Hero enrichment (PR-Hero-Premium)
      secondaryCtaText?: string
      secondaryCtaLink?: string
      trustPills?: { value: string; label: string }[]
      proofLogoNames?: string[]
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
  /**
   * PR-Commerce — seeded into the tenant Products collection for `product`
   * archetype tenants. Optional: non-commerce tenants omit it entirely.
   */
  products?: ProductSeed[]
  /**
   * PR-Commerce — seeded into the tenant store-settings global. Tenant owns
   * the Stripe account; we ship the store pre-enabled with policies written,
   * and the tenant pastes their own keys in the admin UI to go live.
   */
  storeSettings?: {
    storeEnabled: boolean
    currency: string
    shipping?: {
      flatRate?: number
      freeShippingThreshold?: number
      shippingPolicy?: string
    }
    returnsPolicy?: string
  }
}

/** PR-Commerce — one sellable item, written by the swarm, seeded via REST. */
export interface ProductSeed {
  title: string
  slug: string
  price: number
  compareAtPrice?: number
  shortDescription?: string
  description?: string
  imageUrl?: string
  category?: string
  badge?: string
  details?: { label: string; value: string }[]
  available?: boolean
  shippingNote?: string
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

// ── Graphics Department ──

export type LogoStyle = 'wordmark' | 'lettermark' | 'emblem' | 'combination'

export interface BrandColor {
  hex: string
  name: string
  usage: string
}

export interface BrandIdentityBrief {
  brandPersonality: string
  logoSpec: {
    concept: string
    style: LogoStyle
    primaryColor: string
    secondaryColor: string
    fontFamily: string
    svgCode: string        // Full SVG markup for the primary logo
    iconSvgCode: string    // Icon-only variant (square, no wordmark)
  }
  colorSystem: {
    primary: BrandColor
    secondary: BrandColor
    accent: BrandColor
    background: BrandColor
    text: BrandColor
  }
  typographySystem: {
    display: { family: string; weight: string; style: string; usage: string }
    body: { family: string; weight: string; style: string; usage: string }
    accent: { family: string; weight: string; style: string; usage: string }
  }
  brandPattern: {
    description: string
    svgCode: string        // Tileable SVG pattern
  }
  socialTemplates: SocialTemplate[]
  brandGuidelinesMarkdown: string
}

export interface SocialTemplate {
  name: string
  platform: 'instagram_square' | 'instagram_story' | 'facebook_post' | 'linkedin_post'
  widthPx: number
  heightPx: number
  htmlTemplate: string    // Self-contained HTML with inline CSS, uses {{variables}}
  variables: string[]     // List of template variable names e.g. ['headline', 'body', 'cta']
}
