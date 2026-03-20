import type { Metadata } from 'next';
import Link from 'next/link';
import { Home, ChevronRight } from 'lucide-react';

export const metadata: Metadata = {
  title: 'Frequently Asked Questions | Think4BuySale',
  description: 'Find answers to common questions about buying, selling, renting property, agent verification, RERA compliance, and how Think4BuySale works.',
  keywords: 'think4buysale FAQ, property buying questions, real estate FAQ India, how to buy property India, RERA agent questions',
  alternates: { canonical: 'https://think4buysale.com/faq' },
  openGraph: {
    title: 'FAQ | Think4BuySale',
    description: 'Answers to the most common property buying, selling, and renting questions on Think4BuySale.',
    type: 'website',
    url: 'https://think4buysale.com/faq',
    siteName: 'Think4BuySale',
  },
  robots: { index: true, follow: true },
};

interface FaqItem { q: string; a: string }
interface FaqSection { heading: string; items: FaqItem[] }

const FAQ_SECTIONS: FaqSection[] = [
  {
    heading: 'About Think4BuySale',
    items: [
      {
        q: 'What is Think4BuySale?',
        a: 'Think4BuySale is an India-based real estate marketplace that connects home buyers, sellers, and tenants with RERA-verified agents and verified property listings across 50+ cities.',
      },
      {
        q: 'Is Think4BuySale free to use?',
        a: 'Yes. Browsing listings, searching properties, and contacting agents is completely free for buyers and tenants. Property owners can post one listing free of charge. Agents have subscription plans for enhanced visibility and lead access.',
      },
      {
        q: 'Which cities does Think4BuySale cover?',
        a: 'We currently cover 50+ cities including Delhi, Mumbai, Bangalore, Pune, Hyderabad, Chennai, Kolkata, Noida, Gurgaon, Ahmedabad, Kochi, Surat, Jaipur, Thane, and many more.',
      },
    ],
  },
  {
    heading: 'Buying Property',
    items: [
      {
        q: 'How do I search for a property to buy?',
        a: 'Use the search bar on the homepage or visit the Buy section. Filter by city, property type, BHK configuration, price range, and possession status. You can also use the map view to browse by location.',
      },
      {
        q: 'Are the listings on Think4BuySale verified?',
        a: 'Every listing undergoes a basic verification check before going live. Photo-verified listings are marked with a special badge. We also cross-check agent credentials with RERA registration databases.',
      },
      {
        q: 'How do I schedule a site visit?',
        a: "On any property detail page, click the \"Schedule Visit\" button. Fill in your preferred date and time, and the agent or owner will confirm within 24 hours.",
      },
      {
        q: 'Can I save properties and come back later?',
        a: 'Yes. Create a free account and use the heart/save icon on any listing. All saved properties appear in your Buyer Dashboard under Saved Properties.',
      },
    ],
  },
  {
    heading: 'Selling / Renting Out Property',
    items: [
      {
        q: 'How do I list my property on Think4BuySale?',
        a: 'Click "Post Property FREE" from the header or footer. Complete the 10-step form with your property details, photos, and price. Your listing goes live after a quick review — usually within a few hours.',
      },
      {
        q: 'Is property listing really free?',
        a: 'Yes. One free basic listing is available for all owners. If you want to boost your listing to the top of search results or get a Featured badge, you can upgrade to a paid plan from your Owner Dashboard.',
      },
      {
        q: 'How long does my listing stay active?',
        a: 'Free listings are active for 90 days and can be renewed from your dashboard. Premium and Featured listings have longer active periods depending on the plan.',
      },
      {
        q: 'Can I edit or delete my listing after posting?',
        a: 'Yes. Log in to your Owner Dashboard, go to My Properties, and use the Edit or Remove options next to your listing.',
      },
    ],
  },
  {
    heading: 'Agents & RERA',
    items: [
      {
        q: 'How do I know if an agent is RERA-registered?',
        a: "Look for the Verified badge on the agent's profile. RERA-registered agents have their registration number displayed on their profile page, which you can independently verify on your state's RERA website.",
      },
      {
        q: 'How do I contact an agent?',
        a: 'From any agent profile or property listing page, you can call directly, send a WhatsApp message, or submit an enquiry form. Contact is always free for buyers.',
      },
      {
        q: 'Can I become an agent on Think4BuySale?',
        a: 'Yes. Register an account, complete the onboarding as an Agent, submit your RERA registration number, and complete your profile. Once verified by our team, you will go live on the platform.',
      },
      {
        q: 'What do the Gold, Silver, and Bronze badges mean?',
        a: 'These tier badges reflect an agent\'s authority score, which is calculated from their subscription plan, deal success rate, response speed, customer reviews, and listing quality. Gold is the highest tier.',
      },
    ],
  },
  {
    heading: 'Payments & Brokerage',
    items: [
      {
        q: 'Does Think4BuySale charge brokerage?',
        a: 'Think4BuySale is a platform, not a brokerage. The platform itself does not charge brokerage. Brokerage, if any, is between you and the agent directly and is agreed upon before any transaction.',
      },
      {
        q: 'Are there owner listings with zero brokerage?',
        a: "Yes. Listings marked as \"Owner\" are posted directly by property owners. These typically have zero brokerage for buyers. You can filter for owner-only listings on the search page.",
      },
      {
        q: 'How do agent subscription plans work?',
        a: 'Agents can subscribe to monthly or annual plans that unlock features like premium lead access, boosted listing visibility, featured profile placement, and higher authority scores. Manage subscriptions from the Agent Dashboard.',
      },
    ],
  },
  {
    heading: 'Account & Privacy',
    items: [
      {
        q: 'How do I reset my password?',
        a: 'On the login page, click "Forgot Password" and enter your registered email or phone number. You will receive an OTP to reset your password.',
      },
      {
        q: 'Is my phone number shared with agents?',
        a: 'Your phone number is protected by default. On property pages, the number is masked and only revealed when you click "Show Number" — giving you full control over when to share it.',
      },
      {
        q: 'How do I delete my account?',
        a: 'To request account deletion, email us at support@think4buysale.com with your registered phone number. We will process the request within 7 business days in compliance with data privacy regulations.',
      },
    ],
  },
];

const FAQ_SCHEMA = {
  '@context': 'https://schema.org',
  '@type': 'FAQPage',
  mainEntity: FAQ_SECTIONS.flatMap(s =>
    s.items.map(item => ({
      '@type': 'Question',
      name: item.q,
      acceptedAnswer: { '@type': 'Answer', text: item.a },
    }))
  ),
};

export default function FaqPage() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(FAQ_SCHEMA) }}
      />

      <main className="min-h-screen bg-gray-50 pt-16 pb-20">

        {/* Hero */}
        <section className="bg-gradient-to-br from-primary-800 to-primary-600 text-white py-14 px-4">
          <div className="max-w-3xl mx-auto">
            <nav className="flex items-center gap-2 text-xs text-primary-300 mb-4">
              <Link href="/" className="hover:text-white transition-colors flex items-center gap-1">
                <Home className="w-3.5 h-3.5" />Home
              </Link>
              <ChevronRight className="w-3 h-3" />
              <span className="text-white">FAQ</span>
            </nav>
            <h1 className="text-3xl sm:text-4xl font-extrabold mb-3">Frequently Asked Questions</h1>
            <p className="text-primary-200 text-lg max-w-xl">
              Everything you need to know about buying, selling, renting, and finding agents on Think4BuySale.
            </p>
          </div>
        </section>

        {/* FAQ Content */}
        <div className="max-w-3xl mx-auto px-4 py-12 space-y-10">
          {FAQ_SECTIONS.map(section => (
            <section key={section.heading}>
              <h2 className="text-lg font-bold text-gray-900 mb-4 pb-2 border-b border-gray-200">
                {section.heading}
              </h2>
              <div className="space-y-4">
                {section.items.map(item => (
                  <details
                    key={item.q}
                    className="group bg-white rounded-xl border border-gray-100 shadow-sm"
                  >
                    <summary className="flex items-center justify-between gap-3 px-5 py-4 cursor-pointer list-none select-none">
                      <span className="text-sm font-semibold text-gray-900 group-open:text-primary-700 transition-colors">
                        {item.q}
                      </span>
                      <ChevronRight className="w-4 h-4 text-gray-400 flex-shrink-0 transition-transform group-open:rotate-90" />
                    </summary>
                    <div className="px-5 pb-5">
                      <p className="text-sm text-gray-600 leading-relaxed">{item.a}</p>
                    </div>
                  </details>
                ))}
              </div>
            </section>
          ))}

          {/* Still have questions */}
          <div className="bg-primary-50 rounded-2xl border border-primary-100 px-6 py-8 text-center">
            <h2 className="text-lg font-bold text-gray-900 mb-2">Still Have Questions?</h2>
            <p className="text-gray-500 text-sm mb-5">Our support team is available Monday to Saturday, 9am to 6pm.</p>
            <div className="flex flex-wrap gap-3 justify-center">
              <Link
                href="/contact"
                className="px-5 py-2.5 bg-primary-600 text-white rounded-xl text-sm font-bold hover:bg-primary-700 transition-colors"
              >
                Contact Us
              </Link>
              <a
                href="mailto:support@think4buysale.com"
                className="px-5 py-2.5 border border-gray-200 text-gray-700 rounded-xl text-sm font-bold hover:bg-gray-50 transition-colors"
              >
                Email Support
              </a>
            </div>
          </div>
        </div>

      </main>
    </>
  );
}
