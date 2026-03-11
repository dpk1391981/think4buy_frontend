import type { Metadata } from 'next';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'Terms & Conditions | think4buysale',
  description: 'Read the terms and conditions for using think4buysale real estate platform.',
};

export default function TermsPage() {
  return (
    <div className="min-h-screen bg-gray-50 pt-20 pb-16">
      <div className="container-max max-w-3xl">
        <div className="bg-white rounded-2xl border border-gray-100 p-8 md:p-12">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Terms &amp; Conditions</h1>
          <p className="text-gray-500 text-sm mb-8">Last updated: March 2026</p>

          <div className="prose prose-gray max-w-none space-y-8 text-sm text-gray-700 leading-relaxed">
            <section>
              <h2 className="text-lg font-semibold text-gray-900 mb-3">1. Acceptance of Terms</h2>
              <p>By accessing or using think4buysale (&quot;the Platform&quot;), you agree to be bound by these Terms and Conditions. If you do not agree, please do not use the platform.</p>
            </section>

            <section>
              <h2 className="text-lg font-semibold text-gray-900 mb-3">2. Platform Description</h2>
              <p>think4buysale is an online real estate marketplace that connects property buyers, sellers, and renters across India. We provide a platform for listing, searching, and inquiring about properties.</p>
            </section>

            <section>
              <h2 className="text-lg font-semibold text-gray-900 mb-3">3. User Accounts</h2>
              <ul className="list-disc pl-5 space-y-2">
                <li>You must provide accurate and complete information when registering.</li>
                <li>You are responsible for maintaining the confidentiality of your account.</li>
                <li>One person may not maintain more than one account.</li>
                <li>We reserve the right to terminate accounts that violate these terms.</li>
              </ul>
            </section>

            <section>
              <h2 className="text-lg font-semibold text-gray-900 mb-3">4. Property Listings</h2>
              <ul className="list-disc pl-5 space-y-2">
                <li>All listings must be genuine, accurate, and not misleading.</li>
                <li>You must have the legal right to list the property.</li>
                <li>Duplicate or spam listings are strictly prohibited.</li>
                <li>We reserve the right to remove any listing that violates our policies.</li>
                <li>Listing photos must be of the actual property being listed.</li>
              </ul>
            </section>

            <section>
              <h2 className="text-lg font-semibold text-gray-900 mb-3">5. Prohibited Activities</h2>
              <ul className="list-disc pl-5 space-y-2">
                <li>Posting fraudulent, misleading, or false property information.</li>
                <li>Collecting user data without authorization.</li>
                <li>Using the platform for any illegal purpose.</li>
                <li>Harassing or threatening other users.</li>
                <li>Attempting to manipulate search results or reviews.</li>
              </ul>
            </section>

            <section>
              <h2 className="text-lg font-semibold text-gray-900 mb-3">6. Limitation of Liability</h2>
              <p>think4buysale acts as an intermediary and is not a party to any transaction between buyers and sellers. We do not guarantee the accuracy of listings or the completion of any transaction. Users engage in transactions at their own risk.</p>
            </section>

            <section>
              <h2 className="text-lg font-semibold text-gray-900 mb-3">7. Intellectual Property</h2>
              <p>All content on this platform, including logos, text, graphics, and software, is the property of think4buysale and protected by applicable copyright laws.</p>
            </section>

            <section>
              <h2 className="text-lg font-semibold text-gray-900 mb-3">8. Changes to Terms</h2>
              <p>We reserve the right to modify these terms at any time. Continued use of the platform after changes constitutes acceptance of the new terms.</p>
            </section>

            <section>
              <h2 className="text-lg font-semibold text-gray-900 mb-3">9. Governing Law</h2>
              <p>These terms are governed by the laws of India. Any disputes shall be subject to the exclusive jurisdiction of courts in New Delhi, India.</p>
            </section>

            <section>
              <h2 className="text-lg font-semibold text-gray-900 mb-3">10. Contact Us</h2>
              <p>For questions about these Terms, contact us at: <a href="mailto:legal@think4buysale.com" className="text-blue-600 hover:underline">legal@think4buysale.com</a></p>
            </section>
          </div>

          <div className="mt-10 pt-6 border-t border-gray-100 flex gap-4">
            <Link href="/privacy" className="text-sm text-blue-600 hover:underline font-medium">Privacy Policy</Link>
            <Link href="/" className="text-sm text-gray-500 hover:underline">Back to Home</Link>
          </div>
        </div>
      </div>
    </div>
  );
}
