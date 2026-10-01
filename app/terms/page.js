import Link from 'next/link';

export const metadata = {
  title: 'Terms & Conditions',
  description: 'Terms and conditions for use of this website and interactions with Gillco Group via Quality Real Estate, an authorised channel partner.',
  robots: { index: true, follow: true },
  alternates: { canonical: '/terms' },
};

export default function TermsPage() {
  return (
    <main className="min-h-screen bg-stone-50">
      <div className="max-w-4xl mx-auto px-4 py-16">
        <nav className="text-sm text-emerald-900 mb-6">
          <Link href="/" className="hover:underline">← Home</Link>
          <span className="mx-2 text-emerald-900/40">/</span>
          <span className="text-emerald-900/60">Terms & Conditions</span>
        </nav>

        <h1 className="text-4xl md:text-5xl font-serif text-emerald-900 mb-2">Terms & Conditions</h1>
        <p className="text-sm text-slate-500 mb-10">Last updated: {new Date().toLocaleDateString('en-IN', { year: 'numeric', month: 'long', day: 'numeric' })}</p>

        <div className="prose prose-slate max-w-none prose-headings:text-emerald-900 prose-headings:font-serif prose-a:text-emerald-700">
          <p className="lead">
            This website (<strong>gillcogroup.org</strong>) is designed, published and managed by
            <strong> Quality Real Estate</strong>, an authorised channel partner / sales organiser of
            <strong> Gillco Developers and Builders Private Limited</strong> (“Gillco Group” / “Company”),
            solely for marketing, branding and promotional purposes. By accessing or using this website,
            you agree to be bound by these Terms & Conditions.
          </p>

          <h2>1. Nature of the Website</h2>
          <ul>
            <li>This website serves as an informational and marketing portal for Gillco Group projects.</li>
            <li>All information provided here is <strong>indicative</strong> and is subject to change at the sole discretion of Gillco Group without prior notice.</li>
            <li>Nothing on this website constitutes an offer, invitation to offer, or legally binding commitment on behalf of the Company.</li>
            <li>All renders, floor plans, pricing, specifications and timelines are indicative only and may be modified by the Company.</li>
          </ul>

          <h2>2. RERA Compliance</h2>
          <ul>
            <li>All projects marketed on this website are/will be registered under the Real Estate (Regulation and Development) Act, 2016 (“RERA”). Project-specific RERA registration numbers are published on the relevant project pages.</li>
            <li>Visitors are advised to independently verify project RERA status on the Punjab Real Estate Regulatory Authority website at <a href="https://rera.punjab.gov.in" target="_blank" rel="noopener noreferrer">rera.punjab.gov.in</a> before taking any booking or financial decision.</li>
          </ul>

          <h2>3. Bookings & Allotment</h2>
          <ul>
            <li>Prevailing rates applicable are those <strong>on the date on which the application form is submitted to and received by Gillco Group</strong>, and not the rates represented at any earlier point of discussion.</li>
            <li>Final acceptance or rejection of any booking is at the <strong>sole discretion of Gillco Group</strong>.</li>
            <li>Allotments are confirmed only on receipt of the formal Allotment Letter / Agreement to Sell issued by Gillco Group.</li>
            <li>No employee, agent or channel partner (including Quality Real Estate) is authorised to make any assurance or promise outside the written offer/application form issued by Gillco Group.</li>
          </ul>

          <h2>4. Payments</h2>
          <ul>
            <li>All payments towards booking, instalments or allotment must be made in the name of <strong>“Gillco Developers and Builders Private Limited”</strong> only.</li>
            <li>Accepted modes: <strong>crossed cheque, demand draft, pay order or RTGS/NEFT</strong>. <strong>Cash payments are strictly not accepted</strong> for any booking.</li>
            <li>Only Gillco Group is authorised to issue official receipts/acknowledgements. Receipts from channel partners or any other third party are not valid.</li>
            <li>GST and other applicable taxes shall be charged at rates in force at the time of payment.</li>
          </ul>

          <h2>5. Intellectual Property</h2>
          <ul>
            <li>All logos, trademarks, images, photographs, renders, floor plans, brochures and content on this website are the property of Gillco Group and are used by Quality Real Estate under express authorisation for the marketing of Gillco Group projects.</li>
            <li>No person may reproduce, redistribute or reuse any content without prior written consent of Gillco Group.</li>
          </ul>

          <h2>6. Prohibited Conduct</h2>
          <ul>
            <li>Visitors must not use this website for any unlawful purpose, scrape data in violation of applicable law, or attempt to breach the website’s security.</li>
            <li>Submitting false personal information, impersonating another person, or sending spam enquiries is prohibited.</li>
          </ul>

          <h2>7. Limitation of Liability</h2>
          <ul>
            <li>Gillco Group and Quality Real Estate shall not be liable for any direct, indirect, incidental, consequential or special damages arising from the use of this website or reliance on any information displayed herein.</li>
            <li>The Company shall not be responsible for the acts, omissions, misrepresentations or unauthorised promises of any channel partner, sales organiser, real estate agent or third party beyond the scope of the Company’s formal written agreements.</li>
          </ul>

          <h2>8. Compliance with Law</h2>
          <ul>
            <li>All transactions are governed by the Real Estate (Regulation and Development) Act, 2016 and Rules thereunder, the Foreign Exchange Management Act, 1999 (for NRIs/OCIs), and the Prevention of Money Laundering Act, 2002 (PMLA) and Rules thereunder, as applicable.</li>
          </ul>

          <h2>9. Governing Law & Jurisdiction</h2>
          <p>
            These Terms shall be governed by and construed in accordance with the laws of India. The courts at
            <strong> Mohali, Punjab</strong> and the <strong>Hon’ble High Court of Punjab & Haryana at Chandigarh</strong>
            shall have exclusive jurisdiction over any dispute arising from or in connection with this website or
            any transaction facilitated through it.
          </p>

          <h2>10. Contact</h2>
          <p>
            For any questions regarding these Terms & Conditions, please contact Quality Real Estate (website manager and authorised channel partner)
            or Gillco Group at <a href="mailto:support@gillcogroup.org">support@gillcogroup.org</a>.
          </p>

          <hr />
          <p className="text-sm text-slate-500">
            Company registered office: SCF 23-24, Opp SAS Academy, Morinda Road, Rupnagar, Punjab — 140001.<br />
            Website designed, published and managed by Quality Real Estate, an authorised channel partner with
            Gillco Group / Gillco Developers and Builders Pvt. Ltd., for marketing, branding and promotional purposes.
          </p>
        </div>
      </div>
    </main>
  );
}
