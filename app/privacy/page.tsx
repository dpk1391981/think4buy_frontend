import type { Metadata } from 'next';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'Privacy Policy | think4buysale',
  description: 'Learn how think4buysale collects, uses, and protects your personal information.',
};

export default function PrivacyPage() {
  return (
    <div className="min-h-screen bg-gray-50 pt-20 pb-16">
      <div className="container-max max-w-3xl">
        <div className="bg-white rounded-2xl border border-gray-100 p-8 md:p-12">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Privacy Policy</h1>
          <p className="text-gray-500 text-sm mb-8">Last updated: March 2026</p>

          <div className="space-y-8 text-sm text-gray-700 leading-relaxed">
            <section>
              <h2 className="text-lg font-semibold text-gray-900 mb-3">1. Information We Collect</h2>
              <p className="mb-3">We collect the following types of information when you use think4buysale:</p>
              <ul className="list-disc pl-5 space-y-2">
                <li><strong>Account Information:</strong> Name, email address, phone number when you register.</li>
                <li><strong>Property Listings:</strong> Property details, photos, pricing, and location that you submit.</li>
                <li><strong>Usage Data:</strong> Pages visited, searches performed, properties viewed, and time spent on the platform.</li>
                <li><strong>Device Information:</strong> IP address, browser type, operating system, and device identifiers.</li>
                <li><strong>Communication:</strong> Inquiries sent to property owners and messages exchanged on the platform.</li>
              </ul>
            </section>

            <section>
              <h2 className="text-lg font-semibold text-gray-900 mb-3">2. How We Use Your Information</h2>
              <ul className="list-disc pl-5 space-y-2">
                <li>To provide and improve our real estate marketplace services.</li>
                <li>To verify your identity and prevent fraud.</li>
                <li>To send property alerts, updates, and promotional communications (with your consent).</li>
                <li>To connect buyers with sellers and process inquiries.</li>
                <li>To analyze platform usage and improve user experience.</li>
                <li>To comply with legal obligations.</li>
              </ul>
            </section>

            <section>
              <h2 className="text-lg font-semibold text-gray-900 mb-3">3. Information Sharing</h2>
              <p className="mb-3">We do not sell your personal information. We may share your information with:</p>
              <ul className="list-disc pl-5 space-y-2">
                <li><strong>Property Owners/Agents:</strong> When you submit an inquiry about a property.</li>
                <li><strong>Service Providers:</strong> Third-party vendors who help us operate the platform (payment processors, hosting, analytics).</li>
                <li><strong>Legal Authorities:</strong> When required by law or to protect our rights.</li>
              </ul>
            </section>

            <section>
              <h2 className="text-lg font-semibold text-gray-900 mb-3">4. Data Security</h2>
              <p>We implement industry-standard security measures including encryption, secure servers, and regular security audits to protect your personal information. However, no method of transmission over the internet is 100% secure.</p>
            </section>

            <section>
              <h2 className="text-lg font-semibold text-gray-900 mb-3">5. Cookies &amp; Tracking</h2>
              <p>We use cookies and similar tracking technologies to enhance your browsing experience, analyze site traffic, and personalize content. You can control cookie preferences through your browser settings.</p>
            </section>

            <section>
              <h2 className="text-lg font-semibold text-gray-900 mb-3">6. Your Rights</h2>
              <ul className="list-disc pl-5 space-y-2">
                <li><strong>Access:</strong> Request a copy of the personal data we hold about you.</li>
                <li><strong>Correction:</strong> Update or correct inaccurate information via your profile.</li>
                <li><strong>Deletion:</strong> Request deletion of your account and associated data.</li>
                <li><strong>Opt-out:</strong> Unsubscribe from marketing communications at any time.</li>
              </ul>
            </section>

            <section>
              <h2 className="text-lg font-semibold text-gray-900 mb-3">7. Data Retention</h2>
              <p>We retain your personal information for as long as your account is active or as needed to provide services. After account deletion, we may retain certain information for up to 90 days for legal compliance purposes.</p>
            </section>

            <section>
              <h2 className="text-lg font-semibold text-gray-900 mb-3">8. Children&apos;s Privacy</h2>
              <p>Our platform is not intended for users under 18 years of age. We do not knowingly collect personal information from children.</p>
            </section>

            <section>
              <h2 className="text-lg font-semibold text-gray-900 mb-3">9. Changes to This Policy</h2>
              <p>We may update this Privacy Policy periodically. We will notify you of significant changes via email or a prominent notice on the platform.</p>
            </section>

            <section>
              <h2 className="text-lg font-semibold text-gray-900 mb-3">10. Contact Us</h2>
              <p>For privacy-related questions or to exercise your rights, contact our Privacy Officer at: <a href="mailto:privacy@think4buysale.com" className="text-blue-600 hover:underline">privacy@think4buysale.com</a></p>
            </section>
          </div>

          <div className="mt-10 pt-6 border-t border-gray-100 flex gap-4">
            <Link href="/terms" className="text-sm text-blue-600 hover:underline font-medium">Terms &amp; Conditions</Link>
            <Link href="/" className="text-sm text-gray-500 hover:underline">Back to Home</Link>
          </div>
        </div>
      </div>
    </div>
  );
}
