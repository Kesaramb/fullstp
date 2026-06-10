import type { ReactNode } from 'react'

export const metadata = {
  title: 'Terms of Service — FullStop',
  description: 'The terms that govern your use of FullStop.',
}

const EFFECTIVE_DATE = 'June 10, 2026'
const CONTACT_EMAIL = 'hello@fullstp.com'

function Section({ id, title, children }: { id: string; title: string; children: ReactNode }) {
  return (
    <section id={id} className="scroll-mt-24">
      <h2 className="text-xl font-bold text-gray-900 mt-10 mb-3">{title}</h2>
      <div className="space-y-3 text-[15px] leading-relaxed text-gray-600">{children}</div>
    </section>
  )
}

export default function TermsOfServicePage() {
  return (
    <div className="min-h-screen bg-white font-sans">
      <header className="bg-gradient-to-br from-[#cbe5ff] via-[#e5f5f0] to-[#f8edda] border-b border-gray-100">
        <div className="max-w-3xl mx-auto px-6 py-12">
          <a href="/" className="inline-flex items-center gap-2 text-sm font-bold text-gray-900 mb-6">
            <span>⚡</span> FullStop
          </a>
          <h1 className="text-3xl font-bold text-gray-900">Terms of Service</h1>
          <p className="text-gray-600 mt-2 text-[15px]">Effective {EFFECTIVE_DATE}</p>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-6 py-10">
        <p className="text-[15px] leading-relaxed text-gray-600">
          These Terms of Service (&ldquo;Terms&rdquo;) govern your access to and use of{' '}
          <strong>fullstp.com</strong> and the services we provide, including our AI website-building
          platform and the websites it generates and hosts (collectively, the &ldquo;Service&rdquo;).
          By creating an account or using the Service, you agree to these Terms. If you do not agree,
          do not use the Service.
        </p>

        <Section id="service" title="1. The Service">
          <p>
            FullStop uses automated, AI-driven workflows to design, build, deploy, and help operate
            websites based on the information you provide. Features, plans, and limits may change,
            and we may add, modify, or discontinue parts of the Service at any time.
          </p>
        </Section>

        <Section id="accounts" title="2. Accounts & eligibility">
          <p>
            You must be at least 16 years old and able to form a binding contract to use the Service.
            You are responsible for the accuracy of your account information, for keeping your
            credentials secure, and for all activity under your account. Notify us promptly of any
            unauthorized use.
          </p>
        </Section>

        <Section id="your-content" title="3. Your content & license to us">
          <p>
            You retain ownership of the business information, text, images, and other materials you
            submit (&ldquo;Your Content&rdquo;). You grant FullStop a non-exclusive, worldwide license
            to host, process, reproduce, and adapt Your Content solely to operate and provide the
            Service — including sending it to our AI and infrastructure providers to generate and run
            your site. You represent that you have the rights to submit Your Content and that it does
            not infringe others&rsquo; rights or violate any law.
          </p>
        </Section>

        <Section id="acceptable-use" title="4. Acceptable use">
          <p>You agree not to use the Service to:</p>
          <ul className="list-disc pl-6 space-y-2">
            <li>break the law or infringe intellectual-property, privacy, or other rights;</li>
            <li>publish malicious code, spam, phishing, or deceptive or fraudulent content;</li>
            <li>
              create content that is unlawful, hateful, harassing, sexually exploitative of minors,
              or that promotes violence;
            </li>
            <li>
              probe, scan, overload, or attempt to gain unauthorized access to the Service or other
              tenants&rsquo; sites or data;
            </li>
            <li>resell or misrepresent the Service, or circumvent usage limits or security controls.</li>
          </ul>
          <p>We may remove content or suspend accounts that violate these Terms.</p>
        </Section>

        <Section id="creator" title="5. Creator marketplace">
          <p>
            If you submit templates or components to the marketplace, you confirm you own or have the
            rights to them, and you grant FullStop and its users a license to display, distribute,
            and use them within the Service. Submissions are reviewed before approval, and we may
            decline or remove any submission at our discretion. Other users may add approved
            components to their sites.
          </p>
        </Section>

        <Section id="ai" title="6. AI-generated output">
          <p>
            Parts of the Service generate content automatically using AI. AI output may be
            inaccurate, incomplete, or similar to content generated for others, and is provided for
            you to review and edit. You are responsible for reviewing and approving anything you
            publish. FullStop does not warrant that generated content is accurate, original, or fit
            for a particular purpose.
          </p>
        </Section>

        <Section id="ownership" title="7. Ownership of your site & our platform">
          <p>
            Subject to these Terms and any third-party assets (such as stock images, which remain
            governed by their providers&rsquo; licenses), the website code we generate for you is
            yours to use, export, and run independently. FullStop retains all rights in the platform,
            software, models, templates, and brand that power the Service. Nothing in these Terms
            transfers ownership of the platform to you.
          </p>
        </Section>

        <Section id="plans" title="8. Plans, limits & payment">
          <p>
            The Service is currently offered with usage limits that vary by plan (for example, the
            number of sites and monthly builds). Paid plans are not yet generally available; if and
            when we introduce paid plans, applicable fees, billing terms, and refund policies will be
            presented at the point of purchase and incorporated into these Terms.
          </p>
        </Section>

        <Section id="third-party" title="9. Third-party services">
          <p>
            The Service relies on third-party providers (including AI, DNS/CDN, email, and stock-image
            providers) and may link to third-party sites. We are not responsible for third-party
            services or content, and your use of them may be subject to their own terms.
          </p>
        </Section>

        <Section id="disclaimer" title="10. Disclaimers">
          <p>
            The Service is provided <strong>&ldquo;as is&rdquo;</strong> and{' '}
            <strong>&ldquo;as available,&rdquo;</strong> without warranties of any kind, whether
            express or implied, including merchantability, fitness for a particular purpose, and
            non-infringement. We do not warrant that the Service will be uninterrupted, error-free, or
            secure, or that generated content will meet your requirements.
          </p>
        </Section>

        <Section id="liability" title="11. Limitation of liability">
          <p>
            To the fullest extent permitted by law, FullStop and its suppliers will not be liable for
            any indirect, incidental, special, consequential, or punitive damages, or for any loss of
            profits, revenue, data, or goodwill. Our total liability for any claim relating to the
            Service will not exceed the greater of the amounts you paid us in the 12 months before the
            claim or US $100. Some jurisdictions do not allow certain limitations, so some of these
            may not apply to you.
          </p>
        </Section>

        <Section id="indemnity" title="12. Indemnification">
          <p>
            You agree to indemnify and hold FullStop harmless from claims, damages, and expenses
            (including reasonable legal fees) arising from Your Content, your use of the Service, the
            sites you publish, or your violation of these Terms or applicable law.
          </p>
        </Section>

        <Section id="termination" title="13. Termination">
          <p>
            You may stop using the Service and delete your account at any time. We may suspend or
            terminate your access if you violate these Terms or to protect the Service or others.
            Because every generated site is a portable codebase you can export, you can take your site
            with you. Sections that by their nature should survive termination (such as ownership,
            disclaimers, liability limits, and indemnification) will continue to apply.
          </p>
        </Section>

        <Section id="changes" title="14. Changes to these Terms">
          <p>
            We may update these Terms from time to time. When we make material changes, we will update
            the &ldquo;Effective&rdquo; date above and, where appropriate, notify you. Your continued
            use of the Service after an update means you accept the revised Terms.
          </p>
        </Section>

        <Section id="law" title="15. Governing law & disputes">
          <p>
            These Terms are governed by the laws applicable at FullStop&rsquo;s principal place of
            business, without regard to conflict-of-laws rules, and you agree to the exclusive
            jurisdiction of its courts, except where applicable law gives you the right to bring
            claims elsewhere.
          </p>
        </Section>

        <Section id="contact" title="16. Contact">
          <p>
            Questions about these Terms? Email us at{' '}
            <a href={`mailto:${CONTACT_EMAIL}`} className="font-medium text-blue-600 hover:text-blue-700">
              {CONTACT_EMAIL}
            </a>
            . See also our{' '}
            <a href="/privacy" className="font-medium text-blue-600 hover:text-blue-700">
              Privacy Policy
            </a>
            .
          </p>
        </Section>

        <div className="mt-12 border-t border-gray-100 pt-6 text-sm text-gray-400">
          <a href="/" className="hover:text-gray-700">
            ← Back to home
          </a>
        </div>
      </main>
    </div>
  )
}
