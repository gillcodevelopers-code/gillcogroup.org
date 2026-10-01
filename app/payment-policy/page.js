import Link from 'next/link';

export const metadata = {
  title: 'Payment Policy',
  description: 'Accepted payment methods, modes and policies for bookings at Gillco Group projects.',
  robots: { index: true, follow: true },
  alternates: { canonical: '/payment-policy' },
};

export default function PaymentPolicyPage() {
  return (
    <main className="min-h-screen bg-stone-50">
      <div className="max-w-4xl mx-auto px-4 py-16">
        <nav className="text-sm text-emerald-900 mb-6">
          <Link href="/" className="hover:underline">← Home</Link>
          <span className="mx-2 text-emerald-900/40">/</span>
          <span className="text-emerald-900/60">Payment Policy</span>
        </nav>

        <h1 className="text-4xl md:text-5xl font-serif text-emerald-900 mb-2">Payment Policy</h1>
        <p className="text-sm text-slate-500 mb-10">Last updated: {new Date().toLocaleDateString('en-IN', { year: 'numeric', month: 'long', day: 'numeric' })}</p>

        <div className="prose prose-slate max-w-none prose-headings:text-emerald-900 prose-headings:font-serif prose-a:text-emerald-700">
          <p className="lead">
            All payments towards booking, allotment or instalments of any Gillco Group project must strictly follow this
            policy. This page applies to every customer who books through this website (<strong>gillcogroup.org</strong>)
            via <strong>Quality Real Estate</strong> (authorised channel partner) or directly with Gillco Group.
          </p>

          <h2>1. Payee Name</h2>
          <p>
            All payments must be made in the name of:<br />
            <strong>“Gillco Developers and Builders Private Limited”</strong><br />
            PAN: AACCG1275G<br />
            Registered office: SCF 23-24, Opp SAS Academy, Morinda Road, Rupnagar, Punjab — 140001.
          </p>
          <p>Cheques, DDs or electronic transfers made in any other name will not be accepted and will be returned.</p>

          <h2>2. Accepted Modes of Payment</h2>
          <ul>
            <li>✅ <strong>Crossed Account-Payee Cheque</strong></li>
            <li>✅ <strong>Demand Draft (DD)</strong></li>
            <li>✅ <strong>Pay Order</strong></li>
            <li>✅ <strong>RTGS / NEFT / IMPS</strong> — bank account details will be shared only through official Gillco Group communication</li>
            <li>❌ <strong>CASH IS NOT ACCEPTED</strong> under any circumstances for booking, instalments or any other dues</li>
          </ul>

          <h2>3. Receipts & Acknowledgements</h2>
          <ul>
            <li>Official receipts shall be issued <strong>only</strong> by Gillco Group on company letterhead signed by authorised personnel.</li>
            <li>Receipts or acknowledgements issued by any channel partner, sales agent, Quality Real Estate representative, or any other third party are <strong>not valid</strong> and must not be relied upon.</li>
            <li>Always insist on an official Gillco Group receipt within 7 working days of making payment.</li>
          </ul>

          <h2>4. Payment Plans</h2>
          <ul>
            <li>Each project has its own published payment plan (CLP, Flexi, Possession-linked, etc.) — the applicable plan will be clearly specified in your Allotment Letter and Agreement to Sell.</li>
            <li>All instalments are time-bound. Delay in payment may attract interest at the rate specified in your Allotment Letter / Agreement to Sell, as per RERA guidelines.</li>
          </ul>

          <h2>5. Pricing</h2>
          <ul>
            <li>Prices applicable will be those <strong>prevailing on the date your Application for Booking is formally received by Gillco Group</strong>, and not those represented at any earlier stage.</li>
            <li>All prices are exclusive of GST, stamp duty, registration charges and any other statutory levies, which shall be payable additionally at the rates in force on the date of payment.</li>
            <li>Floor-rise charges, PLC (preferential location charges), parking, maintenance deposits and any other charges will be as per the published price list for each project.</li>
          </ul>

          <h2>6. Taxes</h2>
          <ul>
            <li>Goods and Services Tax (GST) shall be applicable at the rate in force from time to time on all payments made for under-construction units.</li>
            <li>TDS (Tax Deducted at Source) by the buyer shall be applicable as per Section 194-IA of the Income Tax Act, 1961, where applicable.</li>
          </ul>

          <h2>7. NRI / Foreign Payments</h2>
          <ul>
            <li>Non-Resident Indians (NRIs) and Persons of Indian Origin (PIOs) may remit funds via NRE / NRO / FCNR accounts in accordance with FEMA, 1999.</li>
            <li>It is the responsibility of the buyer to comply with all FEMA and RBI remittance regulations.</li>
            <li>PAN card, passport copy and NRE/NRO account bank statements may be required for KYC.</li>
          </ul>

          <h2>8. Anti-Money Laundering (PMLA)</h2>
          <p>
            All bookings are subject to KYC verification under the Prevention of Money Laundering Act, 2002 (PMLA) and
            rules thereunder. Gillco Group reserves the right to decline or reverse any booking that fails KYC or raises
            suspicion of money laundering, with full refund of amounts paid (less applicable deductions, if any, as per
            applicable law).
          </p>

          <h2>9. Fraud Prevention</h2>
          <p>
            Never share your card details, OTP, or make payments to any personal bank account under the name of an
            individual. If anyone asks for payment outside the modes listed above, immediately report it to Gillco Group at
            <a href="mailto:support@gillcogroup.org"> support@gillcogroup.org</a> or <strong>+91 90417 95879</strong>.
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
