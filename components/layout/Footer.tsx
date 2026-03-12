import Link from 'next/link';
import {
  Home, Mail, Phone, MapPin,
  Facebook, Twitter, Instagram, Youtube,
  Smartphone, Download,
} from 'lucide-react';
import FooterSeoLinks from './FooterSeoLinks';

// ── Static data ───────────────────────────────────────────────────────────────

const SECONDARY_LINKS = [
  { label: 'Home',              href: '/'               },
  { label: 'About Us',          href: '/about'          },
  { label: 'Contact Us',        href: '/contact'        },
  { label: 'Feedback',          href: '/feedback'       },
  { label: 'Complaints',        href: '/complaints'     },
  { label: 'Terms & Conditions',href: '/terms'          },
  { label: 'Privacy Policy',    href: '/privacy'        },
  { label: 'Testimonials',      href: '/testimonials'   },
  { label: 'Sitemap',           href: '/sitemap.xml'    },
  { label: 'Property Leads',    href: '/property-leads' },
  { label: 'FAQ',               href: '/faq'            },
  { label: 'Advertise With Us', href: '/advertise'      },
];

const SOCIAL_LINKS = [
  { Icon: Facebook,  href: 'https://facebook.com/think4buysale',  label: 'Facebook'    },
  { Icon: Twitter,   href: 'https://twitter.com/think4buysale',   label: 'Twitter / X' },
  { Icon: Instagram, href: 'https://instagram.com/think4buysale', label: 'Instagram'   },
  { Icon: Youtube,   href: 'https://youtube.com/@think4buysale',  label: 'YouTube'     },
];

// ── Component ─────────────────────────────────────────────────────────────────

export default function Footer() {
  return (
    <footer className="bg-gray-900 text-gray-300" itemScope itemType="https://schema.org/WPFooter">

      {/* ════════════════════════════════════════════════════════════════
          DYNAMIC SEO CITY LINKS — client component reads Redux location
          Country level  → top 14 Indian cities
          State selected → top cities in that state (from API)
      ════════════════════════════════════════════════════════════════ */}
      <FooterSeoLinks />

      {/* ════════════════════════════════════════════════════════════════
          MAIN FOOTER INFO
      ════════════════════════════════════════════════════════════════ */}
      <div className="border-b border-gray-800">
        <div className="container-max py-10">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-8">

            {/* Brand + Social + App Download */}
            <div className="lg:col-span-2">
              <Link href="/" className="flex items-center gap-2 mb-4" aria-label="Think4BuySale Home">
                <div className="w-8 h-8 bg-primary-600 rounded-lg flex items-center justify-center">
                  <Home className="w-5 h-5 text-white" />
                </div>
                <span className="text-xl font-bold text-white">
                  think<span className="text-primary-400">4buy</span><span className="text-amber-400">sale</span>
                </span>
              </Link>

              <p className="text-sm leading-relaxed text-gray-400 mb-5 max-w-xs">
                India&apos;s trusted real estate platform. Buy, rent, or sell — verified listings across 50+ cities.
              </p>

              {/* Social Icons */}
              <div className="flex gap-3 mb-6">
                {SOCIAL_LINKS.map(({ Icon, href, label }) => (
                  <a
                    key={label}
                    href={href}
                    aria-label={label}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-9 h-9 bg-gray-800 rounded-lg flex items-center justify-center hover:bg-primary-600 transition-colors"
                  >
                    <Icon className="w-4 h-4" />
                  </a>
                ))}
              </div>

              {/* App Download */}
              <p className="text-xs text-gray-500 uppercase tracking-wider mb-3 font-semibold">Download Our App</p>
              <div className="flex flex-col sm:flex-row gap-2">
                <a
                  href="#"
                  aria-label="Download on Google Play"
                  className="flex items-center gap-2 bg-gray-800 hover:bg-gray-700 transition-colors rounded-lg px-3 py-2 text-xs"
                >
                  <Smartphone className="w-4 h-4 text-green-400 flex-shrink-0" />
                  <span>
                    <span className="block text-gray-500 text-[10px] leading-none">Get it on</span>
                    <span className="text-white font-semibold">Google Play</span>
                  </span>
                </a>
                <a
                  href="#"
                  aria-label="Download on App Store"
                  className="flex items-center gap-2 bg-gray-800 hover:bg-gray-700 transition-colors rounded-lg px-3 py-2 text-xs"
                >
                  <Download className="w-4 h-4 text-blue-400 flex-shrink-0" />
                  <span>
                    <span className="block text-gray-500 text-[10px] leading-none">Download on the</span>
                    <span className="text-white font-semibold">App Store</span>
                  </span>
                </a>
              </div>
            </div>

            {/* Quick Links */}
            <div>
              <h3 className="text-white font-semibold mb-4 text-sm">Quick Links</h3>
              <ul className="space-y-2.5 text-sm">
                {[
                  { label: 'Buy Property',       href: '/buy'           },
                  { label: 'Rent Property',       href: '/rent'          },
                  { label: 'PG / Co-Living',      href: '/pg'            },
                  { label: 'Commercial Space',    href: '/commercial'    },
                  { label: 'New Projects',        href: '/new-projects'  },
                  { label: 'Post Property FREE',  href: '/post-property' },
                  { label: 'Find Agents',         href: '/agents'        },
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
              <h3 className="text-white font-semibold mb-4 text-sm">Our Services</h3>
              <ul className="space-y-2.5 text-sm">
                {[
                  { label: 'Home Loan',           href: '/services/home-loan'          },
                  { label: 'Legal Services',      href: '/services/legal-services'     },
                  { label: 'Interior Design',     href: '/services/interior-design'    },
                  { label: 'Packers & Movers',    href: '/services/packers-movers'     },
                  { label: 'Rental Agreement',    href: '/services/rental-agreement'   },
                  { label: 'Property Insurance',  href: '/services/property-insurance' },
                  { label: 'Vastu Consultation',  href: '/services/vastu'              },
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
              <h3 className="text-white font-semibold mb-4 text-sm">Contact Us</h3>
              <ul className="space-y-3 text-sm">
                <li className="flex items-start gap-2.5">
                  <MapPin className="w-4 h-4 mt-0.5 flex-shrink-0 text-primary-400" />
                  <span className="text-gray-400">123 Business Park, Bandra Kurla Complex, Mumbai 400051</span>
                </li>
                <li className="flex items-center gap-2.5">
                  <Phone className="w-4 h-4 flex-shrink-0 text-primary-400" />
                  <a href="tel:+918800000000" className="hover:text-white transition-colors">+91 88000 00000</a>
                </li>
                <li className="flex items-center gap-2.5">
                  <Mail className="w-4 h-4 flex-shrink-0 text-primary-400" />
                  <a href="mailto:support@think4buysale.com" className="hover:text-white transition-colors">
                    support@think4buysale.com
                  </a>
                </li>
              </ul>

              {/* Partner / Network */}
              {/* <div className="mt-6">
                <p className="text-xs text-gray-500 uppercase tracking-wider mb-3 font-semibold">Partner Sites</p>
                <div className="flex flex-wrap gap-2">
                  {['NoBroker', 'MagicBricks', '99acres', 'Housing'].map((site) => (
                    <span
                      key={site}
                      className="text-xs text-gray-600 bg-gray-800 px-2 py-1 rounded border border-gray-700"
                    >
                      {site}
                    </span>
                  ))}
                </div>
              </div> */}
            </div>

          </div>
        </div>
      </div>

      {/* ════════════════════════════════════════════════════════════════
          SECONDARY NAV
      ════════════════════════════════════════════════════════════════ */}
      <div className="border-b border-gray-800">
        <div className="container-max py-4">
          <nav aria-label="Secondary footer navigation">
            <ul className="flex flex-wrap gap-x-4 gap-y-2 justify-center text-xs text-gray-500">
              {SECONDARY_LINKS.map((link, i) => (
                <li key={link.label} className="flex items-center gap-4">
                  <Link href={link.href} className="hover:text-gray-300 transition-colors">
                    {link.label}
                  </Link>
                  {i < SECONDARY_LINKS.length - 1 && (
                    <span className="text-gray-700 select-none">|</span>
                  )}
                </li>
              ))}
            </ul>
          </nav>
        </div>
      </div>

      {/* ════════════════════════════════════════════════════════════════
          DISCLAIMER + COPYRIGHT
      ════════════════════════════════════════════════════════════════ */}
      <div className="container-max py-5">
        <p className="text-xs text-gray-600 leading-relaxed mb-4 text-center max-w-4xl mx-auto">
          <strong className="text-gray-500">Disclaimer:</strong> Think4BuySale acts as an intermediary between
          property buyers, sellers, and agents. All property listings are user-generated content. We do not
          verify ownership or legal status of listed properties. Users are advised to independently verify
          all information before making any property-related decisions. Think4BuySale shall not be liable
          for any inaccuracies, misrepresentations, or disputes arising from property transactions.
        </p>
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-gray-600">
          <p>© {new Date().getFullYear()} Think4BuySale. All rights reserved.</p>
          <p className="text-center">
            Made with ♥ in India &nbsp;|&nbsp; CIN: U70100MH2024PLC000000
          </p>
        </div>
      </div>

    </footer>
  );
}
