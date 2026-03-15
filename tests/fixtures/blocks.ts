/**
 * Block test fixtures — sample data for each block type.
 * Every scaffold-payload-block invocation must add a fixture here.
 */
export const heroFixture = {
  blockType: 'hero' as const,
  id: 'hero-1',
  heading: 'Welcome to Our Site',
  subheading: 'Building the future, one block at a time',
  backgroundImage: null,
  ctaLabel: 'Get Started',
  ctaLink: '/contact',
}

export const richContentFixture = {
  blockType: 'richContent' as const,
  id: 'rich-1',
  content: {
    root: {
      type: 'root',
      children: [
        {
          type: 'paragraph',
          children: [{ text: 'Sample rich text content.' }],
        },
      ],
    },
  },
}

export const callToActionFixture = {
  blockType: 'callToAction' as const,
  id: 'cta-1',
  heading: 'Ready to Start?',
  body: 'Join thousands of businesses using our platform.',
  linkLabel: 'Sign Up Now',
  linkUrl: '/signup',
  variant: 'primary' as const,
}

export const allBlockFixtures = [heroFixture, richContentFixture, callToActionFixture]
