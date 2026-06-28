/**
 * DbSeoContent — renders SEO sections strictly from DB config.
 *
 * Hard rules:
 *  - Only renders a section if the DB field is non-null/non-empty
 *  - No fallback content, no auto-generation
 *  - Admin controls everything via backend SEO tables
 *  - All HTML content fields are parsed and rendered (dangerouslySetInnerHTML)
 *
 * Accepts any object with the fields it needs — compatible with SeoPageConfig,
 * AgentCitySeo, PropertyCitySeo, or any custom shape.
 */
import Link from 'next/link';
import { HelpCircle } from 'lucide-react';

export interface SeoContent {
  h1Title?: string | null;
  introContent?: string | null;
  bottomContent?: string | null;
  faqJson?: { question: string; answer: string }[] | null;
  internalLinks?: { label: string; url: string }[] | null;
}

interface Props {
  config: SeoContent;
  /**
   * 'intro'  — render only h1 + introContent (place above the listing grid)
   * 'bottom' — render only internalLinks + faqs + bottomContent (place below grid)
   * 'body'   — render introContent + internalLinks + faqs + bottomContent (no h1; place below grid when h1 is shown separately)
   * 'all'    — render everything (default, backwards-compatible)
   */
  section?: 'intro' | 'bottom' | 'body' | 'all';
}

/** True if the string contains at least one HTML tag. */
function containsHtml(str: string): boolean {
  return /<[a-z][\s\S]*>/i.test(str);
}

/**
 * Render a string that may be HTML or plain text.
 * If HTML tags are detected → dangerouslySetInnerHTML (parses & renders tags).
 * Otherwise → plain paragraph.
 */
function HtmlOrText({ content, className }: { content: string; className?: string }) {
  if (containsHtml(content)) {
    return <div className={className} dangerouslySetInnerHTML={{ __html: content }} />;
  }
  return <p className={className}>{content}</p>;
}

const proseBase = [
  'prose prose-gray max-w-none',
  'prose-headings:text-gray-900 prose-headings:font-bold',
  'prose-h2:text-xl prose-h3:text-lg',
  'prose-p:text-gray-600 prose-p:leading-relaxed prose-p:my-3',
  'prose-strong:text-gray-800 prose-strong:font-semibold',
  'prose-em:text-gray-700',
  'prose-a:text-primary-600 prose-a:no-underline hover:prose-a:underline',
  'prose-ul:text-gray-600 prose-ol:text-gray-600 prose-li:my-1',
].join(' ');

export default function DbSeoContent({ config, section = 'all' }: Props) {
  const hasH1     = !!config.h1Title?.trim();
  const hasIntro  = !!config.introContent?.trim();
  const hasBottom = !!config.bottomContent?.trim();
  const hasFaqs   = !!config.faqJson?.length;
  const hasLinks  = !!config.internalLinks?.length;

  // Decide which parts to render based on the section prop
  const showIntro  = section === 'all' || section === 'intro';
  const showBottom = section === 'all' || section === 'bottom' || section === 'body';
  const showBodyIntro = section === 'body'; // introContent without h1

  const renderH1    = showIntro && hasH1;
  const renderIntro = (showIntro || showBodyIntro) && hasIntro;
  const renderLinks = showBottom && hasLinks;
  const renderFaqs  = showBottom && hasFaqs;
  const renderBot   = showBottom && hasBottom;

  if (!renderH1 && !renderIntro && !renderLinks && !renderFaqs && !renderBot) return null;

  return (
    <section
      className={section === 'intro'
        ? 'bg-white border-b border-gray-100 py-8'
        : 'bg-white border-t border-gray-100 py-14'}
      aria-label="Property information"
    >
      <div className="container-max max-w-5xl space-y-12">

        {/* ── H1 + Intro Content ───────────────────────────────────────────── */}
        {(renderH1 || renderIntro) && (
          <div>
            {renderH1 && (
              <h1 className="text-2xl md:text-3xl font-bold text-gray-900 mb-3">
                {config.h1Title}
              </h1>
            )}
            {renderIntro && (
              <>
                <div className="w-16 h-1 bg-primary-500 rounded mb-6" />
                {/* seo-speakable — targeted by Speakable JSON-LD cssSelector for AEO */}
                <HtmlOrText content={config.introContent!} className={`seo-speakable ${proseBase}`} />
              </>
            )}
          </div>
        )}

        {/* ── Internal Links ───────────────────────────────────────────────── */}
        {renderLinks && (
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
        {renderFaqs && (
          <div>
            <div className="flex items-center gap-2 mb-5">
              <HelpCircle className="w-5 h-5 text-gray-400" />
              <h2 className="text-lg font-bold text-gray-900">Frequently Asked Questions</h2>
            </div>
            <div className="space-y-3">
              {config.faqJson!.map((faq, i) => (
                <details
                  key={i}
                  open={i === 0}
                  className="group bg-gray-50 border border-gray-100 rounded-xl overflow-hidden"
                >
                  <summary className="px-5 py-4 cursor-pointer text-sm font-semibold text-gray-800 hover:text-primary-700 flex items-center justify-between list-none">
                    {containsHtml(faq.question)
                      ? <span dangerouslySetInnerHTML={{ __html: faq.question }} />
                      : <span>{faq.question}</span>
                    }
                    <span className="text-gray-400 group-open:rotate-180 transition-transform text-lg leading-none ml-3 flex-shrink-0">↓</span>
                  </summary>
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
        {renderBot && (
          <div className={section === 'all' ? 'border-t border-gray-100 pt-10' : ''}>
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
