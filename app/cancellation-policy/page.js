import Link from 'next/link';

export const metadata = {
  title: 'Cancellation & Refund Policy',
  description: 'Policy governing cancellation and refund of bookings for Gillco Group projects.',
  robots: { index: true, follow: true },
  alternates: { canonical: '/cancellation-policy' },
};

export default function CancellationPolicyPage() {
  return (
    <main className="min-h-screen bg-stone-50">
      <div className="max-w-4xl mx-auto px-4 py-16">
        <nav className="text-sm text-emerald-900 mb-6">
          <Link href="/" className="hover:underline">← Home</Link>
          <span className="mx-2 text-emerald-900/40">/</span>
          <span className="text-emerald-900/60">Cancellation & Refund Policy</span>
        </nav>

        <h1 className="text-4xl md:text-5xl font-serif text-emerald-900 mb-2">Cancellation & Refund Policy</h1>
        <p className="text-sm text-slate-500 mb-10">Last updated: {new Date().toLocaleDateString('en-IN', { year: 'numeric', month: 'long', day: 'numeric' })}</p>

        <div className="prose prose-slate max-w-none prose-headings:text-emerald-900 prose-headings:font-serif prose-a:text-emerald-700">
          <p className="lead">
            This Cancellation & Refund Policy outlines the terms under which bookings for units in projects developed by
            <strong> Gillco Developers and Builders Private Limited</strong> (“Gillco Group” / “Company”) may be cancelled
            and refunds processed. It applies to every customer who books via <strong>gillcogroup.org</strong>, via
            <strong> Quality Real Estate</strong> (authorised channel partner), or directly with the Company.
          </p>

          <h2>1. Right to Cancel</h2>
          <ul>
            <li>A customer may seek cancellation of a booking by submitting a <strong>written cancellation request</strong> to Gillco Group at the registered office address or at <a href="mailto:support@gillcogroup.org">support@gillcogroup.org</a>.</li>
            <li>Cancellation shall be effective only from the date the written request is formally received and acknowledged by the Company.</li>
          </ul>

          <h2>2. Refund Timelines</h2>
          <ul>
            <li>Refunds, if applicable, shall be processed within <strong>45–90 working days</strong> from the date of acknowledgement of the cancellation request, subject to clearance of all cheques and completion of applicable documentation.</li>
            <li>Refunds will be made via <strong>RTGS/NEFT/account-payee cheque only</strong>, to the same bank account from which the original payment was received.</li>
            <li>Refunds will NOT be made in cash.</li>
          </ul>

          <h2>3. Deductions</h2>
          <p>The following deductions may apply to any refund, as per Gillco Group’s cancellation policy and the terms of the Allotment Letter / Agreement to Sell:</p>
          <ul>
            <li><strong>Booking amount forfeiture</strong> — up to <strong>10% of the Basic Sale Price (BSP)</strong> or the booking amount, whichever is higher.</li>
            <li><strong>Non-refundable charges</strong> — brokerage, administrative charges, GST already deposited with the government on the units cancelled, and any other statutory levies that cannot be reversed.</li>
            <li><strong>Interest</strong> — interest already paid to any lending bank/financial institution on behalf of the customer (if any) is non-refundable.</li>
            <li>Any outstanding dues, penalties or interest on delayed instalments shall be adjusted against the refundable amount.</li>
          </ul>
          <p className="text-sm italic">
            Exact deductions shall be as per the signed Allotment Letter / Agreement to Sell for the specific project.
            Specific project-level cancellation terms, if more favourable, shall prevail.
          </p>

          <h2>4. Cooling-Off Period (if applicable)</h2>
          <ul>
            <li>If the booking is cancelled within <strong>7 calendar days</strong> of the booking date AND before signing of the Allotment Letter / Agreement to Sell, refund shall be processed with minimal deductions (administrative charges only), subject to RERA guidelines.</li>
            <li>No cooling-off refund shall apply after signing of the Allotment Letter / Agreement to Sell.</li>
          </ul>

          <h2>5. Default by Customer</h2>
          <ul>
            <li>If the customer defaults on any instalment / payment obligations beyond the grace period defined in the Allotment Letter, Gillco Group reserves the right to cancel the allotment after giving due notice, and refund amounts due as per clause 3 above.</li>
          </ul>

          <h2>6. Project-Level Cancellation by the Company</h2>
          <ul>
            <li>In the extraordinary event that the Company itself cancels or modifies the project, refunds and compensation shall be governed by applicable RERA provisions and project-specific terms.</li>
            <li>In such event, refunds shall be processed in accordance with Section 18 of the RERA Act, 2016.</li>
          </ul>

          <h2>7. Channel Partner / Agent Cancellation</h2>
          <ul>
            <li>Quality Real Estate (and any other channel partner / sales organiser) is NOT authorised to process cancellations or refunds. All cancellation requests must be addressed to Gillco Group directly.</li>
            <li>No cash refund will be issued by any channel partner. All refunds originate only from the Company bank account.</li>
          </ul>

          <h2>8. Dispute Resolution</h2>
          <ul>
            <li>Any disputes arising out of or in connection with cancellation and refund shall be resolved in accordance with the terms of the Allotment Letter / Agreement to Sell and RERA, 2016.</li>
            <li>Jurisdiction: Courts at <strong>Mohali, Punjab</strong> and the <strong>Hon’ble High Court of Punjab & Haryana at Chandigarh</strong>.</li>
          </ul>

          <h2>9. Contact</h2>
          <p>
            To request cancellation or raise any refund-related query, please write to
            <a href="mailto:support@gillcogroup.org"> support@gillcogroup.org</a> with your Allotment Number, Project Name,
            and copy of ID proof. You may also call <strong>+91 90417 95879</strong>.
          </p>

          <hr />
          <p className="text-sm text-slate-500">
            This policy is provided for informational purposes. Specific terms as set out in the signed Allotment Letter
            and Agreement to Sell for your project shall prevail in case of any conflict.<br /><br />
            Website designed, published and managed by Quality Real Estate, an authorised channel partner with
            Gillco Group / Gillco Developers and Builders Pvt. Ltd., for marketing, branding and promotional purposes.
          </p>
        </div>
      </div>
    </main>
  );
}
