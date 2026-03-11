import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, CheckCircle, Star, Phone, ArrowRight } from 'lucide-react';
import ServiceLeadForm from './ServiceLeadForm';

const SERVICES: Record<string, {
  name: string; emoji: string; tagline: string; description: string;
  color: string; bgColor: string; textColor: string;
  features: { title: string; desc: string }[];
  faqs: { q: string; a: string }[];
  partners: string[];
  cta: string; ctaPhone: string;
}> = {
  'home-loan': {
    name: 'Home Loan',
    emoji: '🏦',
    tagline: 'Get the lowest home loan rates from 50+ banks',
    description: 'Compare home loan offers from India\'s leading banks and NBFCs. Our experts help you get the best interest rate with minimal documentation and fastest approvals.',
    color: 'border-blue-200',
    bgColor: 'bg-blue-50',
    textColor: 'text-blue-700',
    features: [
      { title: 'Loan up to ₹10 Cr', desc: 'Get loans for residential, commercial, and plot purchases up to ₹10 crore.' },
      { title: 'Lowest Interest Rates', desc: 'Starting from 8.35% p.a. Compare rates from 50+ lenders in one place.' },
      { title: '24-Hour Approval', desc: 'Get in-principle approval within 24 hours with minimal paperwork.' },
      { title: 'Tax Benefits', desc: 'Save up to ₹3.5 Lakh annually under Section 80C and Section 24(b).' },
      { title: 'Balance Transfer', desc: 'Transfer your existing home loan to get lower interest rates.' },
      { title: 'Doorstep Service', desc: 'Our experts come to you — zero visits to the bank required.' },
    ],
    faqs: [
      { q: 'What is the maximum home loan I can get?', a: 'You can get a home loan up to 90% of the property value depending on the loan amount, your income, and credit score.' },
      { q: 'What documents are required for a home loan?', a: 'You need identity proof, address proof, income proof (salary slips/ITR), bank statements, and property documents.' },
      { q: 'How long does home loan approval take?', a: 'In-principle approval can come within 24 hours. Full disbursement typically takes 7-15 working days.' },
      { q: 'Can I apply for a home loan with a co-applicant?', a: 'Yes. Adding a co-applicant (spouse, parent, or sibling) can increase your loan eligibility significantly.' },
    ],
    partners: ['SBI', 'HDFC', 'ICICI', 'Axis Bank', 'LIC HFL', 'Bajaj Housing'],
    cta: 'Check Your Eligibility',
    ctaPhone: '1800-123-4567',
  },
  'legal-services': {
    name: 'Legal Services',
    emoji: '⚖️',
    tagline: 'Complete legal assistance for property transactions',
    description: 'Our experienced property lawyers handle everything from title verification to registration. Ensure your property deal is legally sound with our end-to-end legal services.',
    color: 'border-purple-200',
    bgColor: 'bg-purple-50',
    textColor: 'text-purple-700',
    features: [
      { title: 'Title Verification', desc: 'Thorough search and verification of property ownership and encumbrance certificate.' },
      { title: 'Sale Deed Drafting', desc: 'Expert drafting of sale deeds, agreements, and all property documents.' },
      { title: 'Property Registration', desc: 'End-to-end assistance with sub-registrar office procedures and stamp duty.' },
      { title: 'Legal Consultation', desc: 'One-on-one sessions with experienced property lawyers.' },
      { title: 'RERA Compliance', desc: 'Verify RERA registrations and check builder credibility for new projects.' },
      { title: 'NRI Services', desc: 'Specialized legal services for NRI property buyers and sellers.' },
    ],
    faqs: [
      { q: 'Why is title verification important?', a: 'Title verification ensures the seller has legal ownership and the property is free from disputes, mortgages, or encumbrances.' },
      { q: 'How much does property registration cost?', a: 'Registration charges are 1% of the property value, while stamp duty varies by state (typically 3-7%).' },
      { q: 'How long does property registration take?', a: 'The sub-registrar appointment and registration process typically takes 1-3 working days after all documents are ready.' },
      { q: 'What is an encumbrance certificate?', a: 'An encumbrance certificate records all transactions on a property, confirming it is free from loans, disputes, or mortgages.' },
    ],
    partners: ['LexPro', 'PropLegal', 'NoBroker Legal', 'Vakil Search', 'Square Yards Legal', 'IndiLaw'],
    cta: 'Book Free Consultation',
    ctaPhone: '1800-234-5678',
  },
  'interior-design': {
    name: 'Interior Design',
    emoji: '🎨',
    tagline: 'Transform your new home with expert designers',
    description: 'India\'s top interior designers at your service. From complete home interiors to modular kitchens and custom furniture — beautiful homes at every budget.',
    color: 'border-pink-200',
    bgColor: 'bg-pink-50',
    textColor: 'text-pink-700',
    features: [
      { title: 'Free 3D Design', desc: 'Get a detailed 3D visualization of your home before any work begins.' },
      { title: 'Modular Kitchen', desc: 'Custom modular kitchens with 10-year warranty on hardware fittings.' },
      { title: 'Wardrobe & Storage', desc: 'Space-optimized wardrobes and storage solutions for every room.' },
      { title: 'False Ceiling & Lighting', desc: 'Stunning false ceiling designs with smart LED lighting systems.' },
      { title: 'Flooring & Tiles', desc: 'Wide selection of flooring options from marble to wooden vinyl.' },
      { title: '45-Day Delivery', desc: 'Guaranteed on-time delivery with a dedicated project manager.' },
    ],
    faqs: [
      { q: 'What is the minimum budget for home interiors?', a: 'A 2BHK interior can start from ₹3.5 lakhs for basic interiors and go up to ₹12+ lakhs for premium designs.' },
      { q: 'How long does interior work take?', a: 'Typically 30-45 days for a standard 2BHK, depending on scope of work and customization.' },
      { q: 'Do you provide warranty on interior work?', a: 'Yes — we provide 1-year service warranty on all work and 10-year warranty on modular kitchen hardware.' },
      { q: 'Can I customize the designs?', a: 'Absolutely. All our designs are fully customizable based on your preferences and budget.' },
    ],
    partners: ['Asian Paints', 'Hettich', 'Blum', 'Kajaria', 'Johnson Tiles', 'Kohler'],
    cta: 'Get Free Quote',
    ctaPhone: '1800-345-6789',
  },
  'packers-movers': {
    name: 'Packers & Movers',
    emoji: '🚚',
    tagline: 'Safe, reliable & affordable moving services',
    description: 'Move your home or office with confidence. Our verified packers & movers provide insured, door-to-door moving services with real-time tracking across India.',
    color: 'border-orange-200',
    bgColor: 'bg-orange-50',
    textColor: 'text-orange-700',
    features: [
      { title: 'Verified Movers', desc: 'All moving partners are background-verified with license and insurance.' },
      { title: 'Insurance Cover', desc: 'Transit insurance up to ₹10 lakhs for all your belongings.' },
      { title: 'Real-time Tracking', desc: 'Track your shipment in real-time with our mobile app.' },
      { title: 'Packing & Unpacking', desc: 'Professional packing with quality materials — we handle everything.' },
      { title: 'Vehicle Transport', desc: 'Safe transportation of bikes, cars, and heavy vehicles.' },
      { title: 'Storage Solutions', desc: 'Secure, climate-controlled storage for 30, 60, or 90 days.' },
    ],
    faqs: [
      { q: 'How is the moving cost calculated?', a: 'Cost depends on distance, volume of goods, floor, and additional services like packing. Get a free quote to know exact pricing.' },
      { q: 'Are my goods insured during transit?', a: 'Yes, all goods are covered with transit insurance. You can also opt for additional comprehensive coverage.' },
      { q: 'How many days in advance should I book?', a: 'We recommend booking at least 3-5 days in advance, especially for month-end moves which are busiest.' },
      { q: 'What items cannot be moved?', a: 'Hazardous materials, perishables, and valuables like jewelry/cash cannot be transported. Contact us for a complete list.' },
    ],
    partners: ['Agarwal Movers', 'Leo Packers', 'VRL Logistics', 'Porter', 'TruckSumo', 'Citysprint'],
    cta: 'Get Moving Quote',
    ctaPhone: '1800-456-7890',
  },
  'rental-agreement': {
    name: 'Rental Agreement',
    emoji: '📄',
    tagline: 'Create legally valid rental agreements in minutes',
    description: 'Generate legally compliant rental agreements online. Our platform handles e-stamping, digital signatures, notarization, and doorstep delivery across India.',
    color: 'border-teal-200',
    bgColor: 'bg-teal-50',
    textColor: 'text-teal-700',
    features: [
      { title: 'Online Creation', desc: 'Fill in details online and get a lawyer-verified agreement in minutes.' },
      { title: 'E-Stamp Paper', desc: 'Official e-stamp paper with unique ID — valid across all courts in India.' },
      { title: 'Digital Signature', desc: 'Legally valid Aadhaar-based e-signatures for both parties.' },
      { title: 'Notarization', desc: 'Online notarization service — no need to visit a notary office.' },
      { title: 'Home Delivery', desc: 'Physical copy delivered to your doorstep within 3-5 working days.' },
      { title: 'Court-Ready', desc: 'Agreements are court-ready and comply with state tenancy laws.' },
    ],
    faqs: [
      { q: 'Is an e-rental agreement legally valid?', a: 'Yes. E-rental agreements with e-stamp paper and digital signatures are legally valid under the IT Act 2000.' },
      { q: 'What is the stamp duty for rental agreement?', a: 'Stamp duty varies by state and lease duration. Typically ₹100-500 for 11-month agreements.' },
      { q: 'Why 11 months instead of 12?', a: 'An 11-month agreement avoids mandatory registration (which is required for leases of 12+ months), saving significant cost.' },
      { q: 'What happens after the agreement expires?', a: 'You can renew the agreement online. Our system sends automatic reminders 30 days before expiry.' },
    ],
    partners: ['Stamp Duty India', 'LegalDesk', 'Vakil No.1', 'DocuSign', 'NoBroker', 'MyAdvo'],
    cta: 'Create Agreement Now',
    ctaPhone: '1800-567-8901',
  },
  'property-insurance': {
    name: 'Property Insurance',
    emoji: '🛡️',
    tagline: 'Protect your property investment comprehensively',
    description: 'Comprehensive property insurance against fire, natural disasters, theft, and structural damage. Affordable premiums, instant policy, and hassle-free claims.',
    color: 'border-green-200',
    bgColor: 'bg-green-50',
    textColor: 'text-green-700',
    features: [
      { title: 'Structure Coverage', desc: 'Protection against fire, earthquakes, floods, and structural damage.' },
      { title: 'Content Coverage', desc: 'Covers furniture, electronics, and household items inside your home.' },
      { title: 'Liability Cover', desc: 'Third-party liability if someone gets injured in your property.' },
      { title: 'Instant Policy', desc: 'Get your digital policy document instantly after payment.' },
      { title: 'Quick Claims', desc: 'Dedicated claims team with 48-hour claim processing guarantee.' },
      { title: 'Affordable Premiums', desc: 'Coverage starting from just ₹3,000/year for a 2BHK apartment.' },
    ],
    faqs: [
      { q: 'What does property insurance cover?', a: 'Standard policies cover fire, lightning, explosion, earthquake, flood, riots, and theft. Premium plans add more perils.' },
      { q: 'Is property insurance mandatory?', a: 'It\'s not legally mandatory but highly recommended, especially if you have a home loan. Many banks require it as a condition.' },
      { q: 'How is the premium calculated?', a: 'Premium is based on property value, location, construction type, and coverage amount. Get an instant quote online.' },
      { q: 'How do I file a claim?', a: 'File a claim online or by calling our 24/7 helpline. Our surveyors assess within 48 hours and settlement follows within 7 days.' },
    ],
    partners: ['LIC', 'New India Assurance', 'HDFC ERGO', 'Bajaj Allianz', 'ICICI Lombard', 'Tata AIG'],
    cta: 'Get Instant Quote',
    ctaPhone: '1800-678-9012',
  },
};

type Params = { slug: string };

export async function generateMetadata({ params }: { params: Params }): Promise<Metadata> {
  const service = SERVICES[params.slug];
  if (!service) return { title: 'Service Not Found' };
  return {
    title: `${service.name} | Think4BuySale Services`,
    description: service.description,
  };
}

export function generateStaticParams() {
  return Object.keys(SERVICES).map((slug) => ({ slug }));
}

export default function ServiceDetailPage({ params }: { params: Params }) {
  const service = SERVICES[params.slug];
  if (!service) notFound();

  return (
    <div className="min-h-screen bg-gray-50 pt-16">

      {/* ── Breadcrumb ── */}
      <div className="bg-white border-b border-gray-100">
        <div className="container-max py-3 flex items-center gap-2 text-sm text-gray-500">
          <Link href="/" className="hover:text-primary-600 transition-colors">Home</Link>
          <span>/</span>
          <Link href="/services" className="hover:text-primary-600 transition-colors">Services</Link>
          <span>/</span>
          <span className="text-gray-900 font-medium">{service.name}</span>
        </div>
      </div>

      {/* ── Hero ── */}
      <section className={`${service.bgColor} border-b ${service.color} py-12 md:py-16`}>
        <div className="container-max">
          <Link
            href="/services"
            className="inline-flex items-center gap-1.5 text-sm text-gray-600 hover:text-gray-900 mb-6 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" /> Back to Services
          </Link>

          <div className="grid md:grid-cols-2 gap-10 items-center">
            <div>
              <div className="text-5xl mb-4">{service.emoji}</div>
              <h1 className="text-3xl md:text-4xl font-extrabold text-gray-900 mb-3">
                {service.name}
              </h1>
              <p className={`text-lg font-semibold ${service.textColor} mb-4`}>
                {service.tagline}
              </p>
              <p className="text-gray-600 leading-relaxed mb-6">{service.description}</p>

              <div className="flex flex-col sm:flex-row gap-3">
                <a
                  href={`tel:${service.ctaPhone}`}
                  className="inline-flex items-center justify-center gap-2 px-6 py-3.5 bg-primary-600 text-white rounded-xl font-bold hover:bg-primary-700 transition-colors"
                >
                  <Phone className="w-4 h-4" /> Call Now: {service.ctaPhone}
                </a>
                <button className={`px-6 py-3.5 border-2 ${service.color} ${service.textColor} rounded-xl font-semibold hover:bg-white transition-colors`}>
                  {service.cta}
                </button>
              </div>
            </div>

            {/* Quick Lead Form */}
            <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6">
              <h3 className="font-bold text-gray-900 mb-1">Get a Free Callback</h3>
              <p className="text-gray-500 text-sm mb-5">Our experts will call you within 30 minutes</p>
              <ServiceLeadForm />
              <p className="text-xs text-gray-400 text-center mt-3">
                Free consultation — no spam, no pressure
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ── Features ── */}
      <section className="py-14 container-max">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">What's Included</h2>
        <p className="text-gray-500 mb-8">Comprehensive features tailored for your needs</p>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {service.features.map((f) => (
            <div key={f.title} className="bg-white rounded-xl border border-gray-100 p-5 shadow-sm">
              <div className="flex items-start gap-3">
                <div className={`w-8 h-8 rounded-lg ${service.bgColor} flex items-center justify-center flex-shrink-0 mt-0.5`}>
                  <CheckCircle className={`w-4 h-4 ${service.textColor}`} />
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900 text-sm mb-1">{f.title}</h3>
                  <p className="text-gray-500 text-xs leading-relaxed">{f.desc}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ── Partners ── */}
      <section className="py-10 bg-white border-y border-gray-100">
        <div className="container-max">
          <p className="text-sm font-semibold text-gray-400 uppercase tracking-wider text-center mb-6">
            Trusted Partners
          </p>
          <div className="flex flex-wrap items-center justify-center gap-4 md:gap-8">
            {service.partners.map((p) => (
              <div
                key={p}
                className={`px-4 py-2 rounded-lg ${service.bgColor} ${service.textColor} font-bold text-sm border ${service.color}`}
              >
                {p}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── FAQs ── */}
      <section className="py-14 container-max max-w-3xl">
        <h2 className="text-2xl font-bold text-gray-900 mb-8">Frequently Asked Questions</h2>
        <div className="space-y-4">
          {service.faqs.map((faq) => (
            <div key={faq.q} className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
              <div className="p-5">
                <div className="flex items-start gap-3">
                  <div className={`w-6 h-6 rounded-full ${service.bgColor} flex items-center justify-center flex-shrink-0 mt-0.5`}>
                    <span className={`text-xs font-bold ${service.textColor}`}>Q</span>
                  </div>
                  <h4 className="font-semibold text-gray-900 text-sm">{faq.q}</h4>
                </div>
                <div className="flex items-start gap-3 mt-3">
                  <div className="w-6 h-6 rounded-full bg-gray-100 flex items-center justify-center flex-shrink-0">
                    <span className="text-xs font-bold text-gray-600">A</span>
                  </div>
                  <p className="text-gray-600 text-sm leading-relaxed">{faq.a}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ── Trust Banner ── */}
      <section className="py-10 bg-primary-600 text-white">
        <div className="container-max flex flex-col md:flex-row items-center justify-between gap-6">
          <div>
            <div className="flex items-center gap-2 mb-1">
              {[1, 2, 3, 4, 5].map((i) => (
                <Star key={i} className="w-5 h-5 text-yellow-400" fill="currentColor" />
              ))}
              <span className="text-white font-semibold ml-1">4.8 / 5</span>
            </div>
            <p className="text-blue-100 text-sm">Trusted by 5 lakh+ customers across India</p>
          </div>
          <div className="flex flex-col sm:flex-row gap-3">
            <a
              href={`tel:${service.ctaPhone}`}
              className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-white text-primary-700 rounded-xl font-bold hover:bg-gray-50 transition-colors"
            >
              <Phone className="w-4 h-4" /> {service.ctaPhone}
            </a>
            <Link
              href="/services"
              className="inline-flex items-center justify-center gap-2 px-6 py-3 border-2 border-white/40 text-white rounded-xl font-semibold hover:border-white transition-colors"
            >
              All Services <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
