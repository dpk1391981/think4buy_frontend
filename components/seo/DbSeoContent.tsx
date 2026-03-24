/**
 * DbSeoContent — renders SEO sections strictly from DB config.
 *
 * Hard rules:
 *  - Only renders a section if the DB field is non-null/non-empty
 *  - No fallback content, no auto-generation
 *  - Admin controls everything via backend SEO tables
 */
import Link from 'next/link';
import { HelpCircle } from 'lucide-react';
import type { SeoPageConfig } from '@/lib/seo/listingPageSeo';

interface Props {
  config: SeoPageConfig;
}

export default function DbSeoContent({ config }: Props) {
  const hasIntro = !!config.introContent;
  const hasBottom = !!config.bottomContent;
  const hasFaqs = !!config.faqJson?.length;
  const hasLinks = !!config.internalLinks?.length;

  if (!hasIntro && !hasBottom && !hasFaqs && !hasLinks) return null;

  return (
    <section className="bg-white border-t border-gray-100 py-14" aria-label="Property information">
      <div className="container-max max-w-5xl space-y-12">

        {/* ── H1 / Intro Content ────────────────────────────────────────── */}
        {hasIntro && (
          <div>
            {config.h1Title && (
              <h1 className="text-2xl md:text-3xl font-bold text-gray-900 mb-2">
                {config.h1Title}
              </h1>
            )}
            <div className="w-16 h-1 bg-primary-500 rounded mb-6" />
            <div
              className="prose prose-sm max-w-none text-gray-600 leading-relaxed"
              dangerouslySetInnerHTML={{ __html: config.introContent! }}
            />
          </div>
        )}

        {/* ── Internal Links ────────────────────────────────────────────── */}
        {hasLinks && (
          <div>
            <h2 className="text-lg font-bold text-gray-900 mb-4">Explore More</h2>
            <div className="flex flex-wrap gap-2">
              {config.internalLinks!.map((link) => (
                <Link
                  key={link.url}
                  href={link.url}
                  className="inline-flex items-center px-4 py-2 rounded-lg bg-gray-50 hover:bg-primary-50 border border-gray-200 hover:border-primary-300 text-sm text-gray-700 hover:text-primary-700 transition-colors"
                >
                  {link.label}
                </Link>
              ))}
            </div>
          </div>
        )}

        {/* ── FAQ Section ───────────────────────────────────────────────── */}
        {hasFaqs && (
          <div>
            <div className="flex items-center gap-2 mb-5">
              <HelpCircle className="w-5 h-5 text-gray-400" />
              <h2 className="text-lg font-bold text-gray-900">Frequently Asked Questions</h2>
            </div>
            <div className="space-y-3">
              {config.faqJson!.map((faq, i) => (
                <details
                  key={i}
                  className="group bg-gray-50 border border-gray-100 rounded-xl overflow-hidden"
                >
                  <summary className="px-5 py-4 cursor-pointer text-sm font-semibold text-gray-800 hover:text-primary-700 flex items-center justify-between list-none">
                    {faq.question}
                    <span className="text-gray-400 group-open:rotate-180 transition-transform text-lg leading-none ml-3 flex-shrink-0">
                      ↓
                    </span>
                  </summary>
                  <div className="px-5 pb-4 text-sm text-gray-600 leading-relaxed border-t border-gray-100 pt-3">
                    {faq.answer}
                  </div>
                </details>
              ))}
            </div>
          </div>
        )}

        {/* ── Bottom / SEO Content ──────────────────────────────────────── */}
        {hasBottom && (
          <div className="border-t border-gray-100 pt-10">
            <div
              className="prose prose-sm max-w-none text-gray-500 leading-relaxed"
              dangerouslySetInnerHTML={{ __html: config.bottomContent! }}
            />
          </div>
        )}

      </div>
    </section>
  );
}
