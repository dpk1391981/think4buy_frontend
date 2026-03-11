import Link from 'next/link';
import { Home, Mail, Phone, MapPin, Facebook, Twitter, Instagram, Youtube } from 'lucide-react';

export default function Footer() {
  return (
    <footer className="bg-gray-900 text-gray-300 hidden md:block">
      <div className="container-max py-12">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-8">
          {/* Brand */}
          <div className="lg:col-span-2">
            <Link href="/" className="flex items-center gap-2 mb-4">
              <div className="w-8 h-8 bg-primary-600 rounded-lg flex items-center justify-center">
                <Home className="w-5 h-5 text-white" />
              </div>
              <span className="text-xl font-bold text-white">
                think<span className="text-primary-400">4buy</span><span className="text-amber-400">sale</span>
              </span>
            </Link>
            <p className="text-sm leading-relaxed text-gray-400 mb-6 max-w-xs">
              India's trusted real estate platform. Find your dream home, office space, or investment property with verified listings.
            </p>
            <div className="flex gap-3">
              {[Facebook, Twitter, Instagram, Youtube].map((Icon, i) => (
                <a
                  key={i}
                  href="#"
                  className="w-9 h-9 bg-gray-800 rounded-lg flex items-center justify-center hover:bg-primary-600 transition-colors"
                >
                  <Icon className="w-4 h-4" />
                </a>
              ))}
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h3 className="text-white font-semibold mb-4">Quick Links</h3>
            <ul className="space-y-2.5 text-sm">
              {[
                { label: 'Buy Property', href: '/buy' },
                { label: 'Rent Property', href: '/rent' },
                { label: 'PG / Co-Living', href: '/pg' },
                { label: 'Commercial Space', href: '/commercial' },
                { label: 'New Projects', href: '/new-projects' },
                { label: 'Post Property FREE', href: '/post-property' },
              ].map((link) => (
                <li key={link.label}>
                  <Link href={link.href} className="hover:text-white transition-colors">
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Services */}
          <div>
            <h3 className="text-white font-semibold mb-4">Our Services</h3>
            <ul className="space-y-2.5 text-sm">
              {[
                { label: 'Home Loan', href: '/services/home-loan' },
                { label: 'Legal Services', href: '/services/legal-services' },
                { label: 'Interior Design', href: '/services/interior-design' },
                { label: 'Packers & Movers', href: '/services/packers-movers' },
                { label: 'Rental Agreement', href: '/services/rental-agreement' },
                { label: 'Property Insurance', href: '/services/property-insurance' },
              ].map((link) => (
                <li key={link.label}>
                  <Link href={link.href} className="hover:text-white transition-colors">
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Contact */}
          <div>
            <h3 className="text-white font-semibold mb-4">Contact Us</h3>
            <ul className="space-y-3 text-sm">
              <li className="flex items-start gap-2.5">
                <MapPin className="w-4 h-4 mt-0.5 flex-shrink-0 text-primary-400" />
                <span>123 Business Park, Bandra Kurla Complex, Mumbai 400051</span>
              </li>
              <li className="flex items-center gap-2.5">
                <Phone className="w-4 h-4 flex-shrink-0 text-primary-400" />
                <a href="tel:+918800000000" className="hover:text-white">+91 88000 00000</a>
              </li>
              <li className="flex items-center gap-2.5">
                <Mail className="w-4 h-4 flex-shrink-0 text-primary-400" />
                <a href="mailto:support@think4buysale.com" className="hover:text-white">
                  support@think4buysale.com
                </a>
              </li>
            </ul>
          </div>
        </div>

        <div className="border-t border-gray-800 mt-10 pt-6 flex flex-col md:flex-row items-center justify-between gap-4 text-sm text-gray-500">
          <p>© 2025 Think4BuySale. All rights reserved.</p>
          <div className="flex gap-6">
            <Link href="/privacy" className="hover:text-gray-300">Privacy Policy</Link>
            <Link href="/terms" className="hover:text-gray-300">Terms of Use</Link>
            <Link href="/sitemap.xml" className="hover:text-gray-300">Sitemap</Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
