import type { ReactNode } from 'react'

export const metadata = {
  title: 'Privacy Policy — FullStop',
  description: 'How FullStop collects, uses, and protects your personal information.',
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

export default function PrivacyPolicyPage() {
  return (
    <div className="min-h-screen bg-white font-sans">
      {/* Header */}
      <header className="bg-gradient-to-br from-[#cbe5ff] via-[#e5f5f0] to-[#f8edda] border-b border-gray-100">
        <div className="max-w-3xl mx-auto px-6 py-12">
          <a href="/" className="inline-flex items-center gap-2 text-sm font-bold text-gray-900 mb-6">
            <span>⚡</span> FullStop
          </a>
          <h1 className="text-3xl font-bold text-gray-900">Privacy Policy</h1>
          <p className="text-gray-600 mt-2 text-[15px]">Effective {EFFECTIVE_DATE}</p>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-6 py-10">
        <p className="text-[15px] leading-relaxed text-gray-600">
          This Privacy Policy explains how FullStop (&ldquo;FullStop,&rdquo; &ldquo;we,&rdquo;
          &ldquo;us,&rdquo; or &ldquo;our&rdquo;) collects, uses, shares, and protects personal
          information when you use <strong>fullstp.com</strong> and the services we provide,
          including our AI website-building platform and the sites it generates and hosts on your
          behalf (collectively, the &ldquo;Service&rdquo;). By using the Service you agree to the
          practices described here.
        </p>

        <Section id="who-we-are" title="1. Who we are">
          <p>
            FullStop is a service that designs, builds, and operates websites for businesses using
            automated, AI-driven workflows. For data you provide to us as an account holder, we act
            as the <em>data controller</em>. For content and visitor data processed on the websites
            we host for you, we generally act as a <em>data processor</em> on your behalf, and you
            are responsible for the privacy practices of the site you publish.
          </p>
        </Section>

        <Section id="what-we-collect" title="2. Information we collect">
          <p>We collect the following categories of information:</p>
          <ul className="list-disc pl-6 space-y-2">
            <li>
              <strong>Account information</strong> — your name, email address, and a securely
              hashed password when you create an account.
            </li>
            <li>
              <strong>Business and project information</strong> — details you provide so we can
              build your site, such as your business name, industry, descriptions, goals, brand
              preferences, and any text or images you submit. Some of this is processed by our AI
              providers to generate your content.
            </li>
            <li>
              <strong>Sites and deployments</strong> — the websites we generate for you, their
              configuration, any custom domains you connect, and administrative credentials we
              create for your generated site.
            </li>
            <li>
              <strong>Usage information</strong> — limited operational data such as the number of
              builds and deployments on your account, and technical logs (e.g. timestamps, error
              messages) needed to operate and secure the Service.
            </li>
            <li>
              <strong>Communications</strong> — messages you send us and emails we send you (such
              as password resets and deployment notifications).
            </li>
            <li>
              <strong>Cookies</strong> — a strictly necessary session cookie used to keep you
              signed in (see Section 6).
            </li>
          </ul>
          <p>
            We do <strong>not</strong> currently process payments or collect payment-card details
            through the Service. We do not use third-party advertising or analytics trackers, and we
            do not sell your personal information.
          </p>
        </Section>

        <Section id="how-we-use" title="3. How we use your information">
          <ul className="list-disc pl-6 space-y-2">
            <li>To create, build, deploy, host, and maintain your website.</li>
            <li>To operate, secure, troubleshoot, and improve the Service.</li>
            <li>To authenticate you and keep your account secure.</li>
            <li>
              To communicate with you about your account, builds, security, and support requests.
            </li>
            <li>To comply with legal obligations and enforce our terms.</li>
          </ul>
        </Section>

        <Section id="legal-bases" title="4. Legal bases (EEA/UK users)">
          <p>
            Where the GDPR or UK GDPR applies, we rely on: <strong>performance of a contract</strong>{' '}
            (to provide the Service you requested); <strong>legitimate interests</strong> (to secure,
            maintain, and improve the Service); <strong>consent</strong> (where required, which you
            may withdraw at any time); and <strong>legal obligation</strong> (to comply with
            applicable law).
          </p>
        </Section>

        <Section id="sharing" title="5. How we share information & service providers">
          <p>
            We share personal information only with service providers (sub-processors) that help us
            run the Service, and only as needed for them to perform their function. These include:
          </p>
          <ul className="list-disc pl-6 space-y-2">
            <li>
              <strong>Anthropic</strong> — AI processing to generate your website strategy, copy, and
              layouts from the information you provide.
            </li>
            <li>
              <strong>Cloudflare</strong> — DNS and content delivery / network protection for our
              platform and connected domains.
            </li>
            <li>
              <strong>Resend</strong> and our own mail infrastructure — to send transactional email
              (e.g. password resets, notifications).
            </li>
            <li>
              <strong>Unsplash</strong> and <strong>Pexels</strong> — to source stock imagery used in
              generated sites.
            </li>
          </ul>
          <p>
            We may also disclose information if required by law, to protect our rights or the safety
            of others, or in connection with a business transfer (e.g. merger or acquisition). We do
            not sell or rent your personal information.
          </p>
        </Section>

        <Section id="cookies" title="6. Cookies">
          <p>
            We use a single <strong>strictly necessary</strong> cookie (named{' '}
            <code className="rounded bg-gray-100 px-1 text-sm">payload-token</code>) to keep you
            signed in to your account. It is essential to the Service and cannot be disabled while
            you are logged in. We do not use advertising, marketing, or third-party analytics
            cookies on our platform. Websites you build and publish may use their own cookies, which
            are your responsibility as that site&rsquo;s operator.
          </p>
        </Section>

        <Section id="retention" title="7. Data retention">
          <p>
            We retain account and project information for as long as your account is active and as
            needed to provide the Service. If you delete your account or ask us to delete your data,
            we will remove or anonymize your personal information within a reasonable period, except
            where we must retain it to comply with legal obligations, resolve disputes, or enforce
            our agreements. Operational logs are kept only as long as needed for security and
            troubleshooting.
          </p>
        </Section>

        <Section id="security" title="8. Security">
          <p>
            We protect your information using industry-standard measures, including encrypted
            connections (TLS), hashed passwords, scoped access controls, and isolation between
            tenant sites. No method of transmission or storage is perfectly secure, but we work to
            protect your information and to promptly address vulnerabilities we discover.
          </p>
        </Section>

        <Section id="your-rights" title="9. Your rights">
          <p>
            Depending on where you live, you may have the right to access, correct, delete, export,
            or restrict the processing of your personal information, to object to certain
            processing, and to withdraw consent. EEA/UK users may also lodge a complaint with their
            local data protection authority. California residents have rights under the CCPA/CPRA,
            including the right to know, delete, and opt out of &ldquo;sale&rdquo; or
            &ldquo;sharing&rdquo; of personal information — note that we do not sell or share
            personal information for cross-context behavioral advertising.
          </p>
          <p>
            To exercise any of these rights, email us at{' '}
            <a href={`mailto:${CONTACT_EMAIL}`} className="font-medium text-blue-600 hover:text-blue-700">
              {CONTACT_EMAIL}
            </a>
            . We will respond within the timeframe required by applicable law.
          </p>
        </Section>

        <Section id="transfers" title="10. International data transfers">
          <p>
            We and our service providers may process your information in countries other than your
            own. Where we transfer personal data internationally, we rely on appropriate safeguards
            (such as standard contractual clauses) where required by law.
          </p>
        </Section>

        <Section id="children" title="11. Children's privacy">
          <p>
            The Service is not directed to children under 16, and we do not knowingly collect
            personal information from them. If you believe a child has provided us personal
            information, contact us and we will delete it.
          </p>
        </Section>

        <Section id="your-sites" title="12. Websites you build with FullStop">
          <p>
            Sites you generate and publish are operated by you. You are the controller of any
            personal data collected from visitors to those sites (for example, through contact
            forms), and you are responsible for providing your own privacy notice and complying with
            applicable laws. We process that visitor data only as your processor, to host and
            operate your site.
          </p>
        </Section>

        <Section id="changes" title="13. Changes to this policy">
          <p>
            We may update this Privacy Policy from time to time. When we make material changes, we
            will update the &ldquo;Effective&rdquo; date above and, where appropriate, notify you.
            Your continued use of the Service after an update means you accept the revised policy.
          </p>
        </Section>

        <Section id="contact" title="14. Contact us">
          <p>
            If you have questions or requests about this Privacy Policy or your personal information,
            contact us at{' '}
            <a href={`mailto:${CONTACT_EMAIL}`} className="font-medium text-blue-600 hover:text-blue-700">
              {CONTACT_EMAIL}
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
