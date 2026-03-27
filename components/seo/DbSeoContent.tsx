/**
 * DbSeoContent — renders SEO sections strictly from DB config.
 *
 * Hard rules:
 *  - Only renders a section if the DB field is non-null/non-empty
 *  - No fallback content, no auto-generation
 *  - Admin controls everything via backend SEO tables
 *  - All HTML content fields are parsed and rendered (dangerouslySetInnerHTML)
 */
import Link from 'next/link';
import { HelpCircle } from 'lucide-react';
import type { SeoPageConfig } from '@/lib/seo/listingPageSeo';

interface Props {
  config: SeoPageConfig;
}

/**
 * Detects whether a string contains any HTML tags.
 * Used to decide whether to render via dangerouslySetInnerHTML or as plain text.
 */
function containsHtml(str: string): boolean {
  return /<[a-z][\s\S]*>/i.test(str);
}

/**
 * Renders a string that may contain HTML or plain text.
 * If it contains HTML tags, uses dangerouslySetInnerHTML.
 * Otherwise renders as plain text inside a <p>.
 */
function HtmlOrText({ content, className }: { content: string; className?: string }) {
  if (containsHtml(content)) {
    return (
      <div
        className={className}
        dangerouslySetInnerHTML={{ __html: content }}
      />
    );
  }
  return <p className={className}>{content}</p>;
}

export default function DbSeoContent({ config }: Props) {
  const hasIntro  = !!config.introContent?.trim();
  const hasBottom = !!config.bottomContent?.trim();
  const hasFaqs   = !!config.faqJson?.length;
  const hasLinks  = !!config.internalLinks?.length;

  if (!hasIntro && !hasBottom && !hasFaqs && !hasLinks) return null;

  return (
    <section className="bg-white border-t border-gray-100 py-14" aria-label="Property information">
      <div className="container-max max-w-5xl space-y-12">

        {/* ── Intro Content ────────────────────────────────────────────────── */}
        {hasIntro && (
          <div>
            <div className="w-16 h-1 bg-primary-500 rounded mb-6" />
            <HtmlOrText
              content={config.introContent!}
              className={[
                'prose prose-gray max-w-none',
                'prose-headings:text-gray-900 prose-headings:font-bold',
                'prose-h2:text-xl prose-h3:text-lg',
                'prose-p:text-gray-600 prose-p:leading-relaxed prose-p:my-3',
                'prose-strong:text-gray-800 prose-strong:font-semibold',
                'prose-a:text-primary-600 prose-a:no-underline hover:prose-a:underline',
                'prose-ul:text-gray-600 prose-ol:text-gray-600',
                'prose-li:my-1',
              ].join(' ')}
            />
          </div>
        )}

        {/* ── Internal Links ───────────────────────────────────────────────── */}
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

        {/* ── FAQ Section ──────────────────────────────────────────────────── */}
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
                    {/* Question may contain HTML (e.g. <strong>) */}
                    {containsHtml(faq.question) ? (
                      <span dangerouslySetInnerHTML={{ __html: faq.question }} />
                    ) : (
                      <span>{faq.question}</span>
                    )}
                    <span className="text-gray-400 group-open:rotate-180 transition-transform text-lg leading-none ml-3 flex-shrink-0">
                      ↓
                    </span>
                  </summary>
                  {/* Answer may contain HTML */}
                  <div className="px-5 pb-4 border-t border-gray-100 pt-3">
                    <HtmlOrText
                      content={faq.answer}
                      className="text-sm text-gray-600 leading-relaxed prose prose-sm prose-gray max-w-none prose-p:my-1.5 prose-strong:text-gray-800 prose-a:text-primary-600"
                    />
                  </div>
                </details>
              ))}
            </div>
          </div>
        )}

        {/* ── Bottom / SEO Content ─────────────────────────────────────────── */}
        {hasBottom && (
          <div className="border-t border-gray-100 pt-10">
            <HtmlOrText
              content={config.bottomContent!}
              className={[
                'prose prose-gray max-w-none',
                'prose-headings:text-gray-800 prose-headings:font-bold',
                'prose-h2:text-xl prose-h2:mt-8 prose-h2:mb-3',
                'prose-h3:text-lg prose-h3:mt-6 prose-h3:mb-2',
                'prose-p:text-gray-500 prose-p:leading-relaxed prose-p:my-3',
                'prose-strong:text-gray-700 prose-strong:font-semibold',
                'prose-a:text-primary-600 prose-a:no-underline hover:prose-a:underline',
                'prose-ul:text-gray-500 prose-ol:text-gray-500 prose-li:my-1',
              ].join(' ')}
            />
          </div>
        )}

      </div>
    </section>
  );
}
