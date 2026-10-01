import Link from 'next/link';

export const metadata = {
  title: 'Privacy Policy',
  description: 'How Gillco Group and Quality Real Estate collect, use and protect your personal information submitted via this website.',
  robots: { index: true, follow: true },
  alternates: { canonical: '/privacy' },
};

export default function PrivacyPage() {
  return (
    <main className="min-h-screen bg-stone-50">
      <div className="max-w-4xl mx-auto px-4 py-16">
        <nav className="text-sm text-emerald-900 mb-6">
          <Link href="/" className="hover:underline">← Home</Link>
          <span className="mx-2 text-emerald-900/40">/</span>
          <span className="text-emerald-900/60">Privacy Policy</span>
        </nav>

        <h1 className="text-4xl md:text-5xl font-serif text-emerald-900 mb-2">Privacy Policy</h1>
        <p className="text-sm text-slate-500 mb-10">Last updated: {new Date().toLocaleDateString('en-IN', { year: 'numeric', month: 'long', day: 'numeric' })}</p>

        <div className="prose prose-slate max-w-none prose-headings:text-emerald-900 prose-headings:font-serif prose-a:text-emerald-700">
          <p className="lead">
            This Privacy Policy explains how <strong>Quality Real Estate</strong> (website manager / authorised channel
            partner) and <strong>Gillco Developers and Builders Private Limited</strong> (“Gillco Group”) collect, use,
            store and share your personal information when you interact with this website (<strong>gillcogroup.org</strong>).
          </p>

          <h2>1. Information We Collect</h2>
          <ul>
            <li><strong>Contact information</strong> you provide voluntarily via enquiry forms, callback requests, brochure downloads or WhatsApp — name, phone number, email, project of interest.</li>
            <li><strong>Technical information</strong> — IP address, browser type, device information, pages visited, referring URL, timestamp.</li>
            <li><strong>Cookies & analytics</strong> — we may use first-party and third-party cookies (e.g., Google Analytics, Meta Pixel) to understand site traffic and improve user experience. You can disable cookies in your browser settings.</li>
          </ul>

          <h2>2. How We Use Your Information</h2>
          <ul>
            <li>To respond to your enquiry about Gillco Group projects and schedule site visits.</li>
            <li>To route your lead to the appropriate sales representative at Gillco Group or Quality Real Estate.</li>
            <li>To send relevant project updates, brochures, event invitations and marketing communications — you may opt out at any time by replying STOP or writing to <a href="mailto:support@gillcogroup.org">support@gillcogroup.org</a>.</li>
            <li>To comply with legal, regulatory and RERA obligations.</li>
            <li>To analyse website usage and improve content, performance and advertising.</li>
          </ul>

          <h2>3. Information Sharing</h2>
          <ul>
            <li>We share your lead information with the <strong>Gillco Group sales team</strong> and authorised sales channels for the purpose of attending to your enquiry.</li>
            <li>We do <strong>not</strong> sell your personal information to any third party.</li>
            <li>Information may be disclosed when required by law, court order, or RERA / regulatory authority.</li>
          </ul>

          <h2>4. Data Security</h2>
          <ul>
            <li>We implement reasonable technical and organisational measures — encrypted database connections, access controls, HTTPS — to protect your information.</li>
            <li>However, no transmission over the internet or electronic storage can be guaranteed 100% secure.</li>
          </ul>

          <h2>5. Data Retention</h2>
          <p>
            Enquiry data is retained for the duration necessary to serve your interest in Gillco Group projects and
            thereafter in accordance with record-keeping obligations under Indian law (typically up to <strong>7 years</strong>
            for financial and KYC-related records under PMLA).
          </p>

          <h2>6. Your Rights</h2>
          <ul>
            <li>You have the right to access, correct, update or request deletion of your personal data.</li>
            <li>You may withdraw consent for marketing communications at any time.</li>
            <li>To exercise any of these rights, write to <a href="mailto:support@gillcogroup.org">support@gillcogroup.org</a>.</li>
          </ul>

          <h2>7. Third-Party Services</h2>
          <p>
            This website may embed third-party content such as YouTube videos, Google Maps and WhatsApp chat links.
            Such third parties operate under their own privacy policies, which we encourage you to review.
          </p>

          <h2>8. Children’s Privacy</h2>
          <p>This website is not directed at persons under 18. We do not knowingly collect personal data from minors.</p>

          <h2>9. Changes to this Policy</h2>
          <p>
            We may update this Privacy Policy from time to time. The latest version will always be available at
            <strong> /privacy</strong> with the revised “Last updated” date.
          </p>

          <h2>10. Contact</h2>
          <p>
            Questions about this Privacy Policy? Write to
            <a href="mailto:support@gillcogroup.org"> support@gillcogroup.org</a> or call <strong>+91 90417 95879</strong>.
          </p>

          <hr />
          <p className="text-sm text-slate-500">
            Website designed, published and managed by Quality Real Estate, an authorised channel partner with
            Gillco Group / Gillco Developers and Builders Pvt. Ltd., for marketing, branding and promotional purposes.
          </p>
        </div>
      </div>
    </main>
  );
}
