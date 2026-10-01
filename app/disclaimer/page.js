import Link from 'next/link';

export const metadata = {
  title: 'Disclaimer',
  description: 'Important disclaimer for the Gillco Group marketing website published by Quality Real Estate.',
  robots: { index: true, follow: true },
  alternates: { canonical: '/disclaimer' },
};

export default function DisclaimerPage() {
  return (
    <main className="min-h-screen bg-stone-50">
      <div className="max-w-4xl mx-auto px-4 py-16">
        <nav className="text-sm text-emerald-900 mb-6">
          <Link href="/" className="hover:underline">← Home</Link>
          <span className="mx-2 text-emerald-900/40">/</span>
          <span className="text-emerald-900/60">Disclaimer</span>
        </nav>

        <h1 className="text-4xl md:text-5xl font-serif text-emerald-900 mb-2">Disclaimer</h1>
        <p className="text-sm text-slate-500 mb-10">Last updated: {new Date().toLocaleDateString('en-IN', { year: 'numeric', month: 'long', day: 'numeric' })}</p>

        <div className="prose prose-slate max-w-none prose-headings:text-emerald-900 prose-headings:font-serif prose-a:text-emerald-700">
          <p className="lead">
            This website (<strong>gillcogroup.org</strong>) is <strong>designed, published and managed by Quality Real Estate</strong>,
            an authorised channel partner / sales organiser of <strong>Gillco Developers and Builders Private Limited</strong>
            (“Gillco Group”), <strong>for marketing, branding and promotional purposes only</strong>.
          </p>

          <h2>Nothing on this website constitutes a legal offer</h2>
          <ul>
            <li>All information, visuals, renders, floor plans, specifications, pricing, launch dates and timelines are indicative, representative and subject to change without notice at the sole discretion of Gillco Group.</li>
            <li>Nothing herein shall constitute an offer, invitation to offer, inducement, or legally binding commitment on behalf of Gillco Group or Quality Real Estate.</li>
            <li>Final terms, prices and specifications shall be as set out in the signed Allotment Letter / Agreement to Sell for the specific project.</li>
          </ul>

          <h2>Verify independently</h2>
          <ul>
            <li>Prospective buyers are advised to independently verify all project details, approvals, RERA registration, title and specifications before taking any booking or financial decision.</li>
            <li>Project RERA status: <a href="https://rera.punjab.gov.in" target="_blank" rel="noopener noreferrer">rera.punjab.gov.in</a></li>
          </ul>

          <h2>Rights reserved</h2>
          <p>
            Gillco Group reserves the right to modify, add, delete or amend any content on this website, or any plan,
            specification, elevation or feature of any project at its sole discretion without any notice or liability.
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
