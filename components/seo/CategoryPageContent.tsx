interface CategorySeo {
  name: string;
  slug: string;
  icon?: string;
  h1?: string;
  introContent?: string;
  seoContent?: string;
  faqs?: { question: string; answer: string }[];
}

interface Props {
  category: CategorySeo;
}

export default function CategoryPageContent({ category }: Props) {
  if (!category.introContent && !category.seoContent && (!category.faqs || !category.faqs.length)) {
    return null;
  }

  return (
    <section className="bg-gray-50 border-t border-gray-100 py-12 mt-8">
      <div className="max-w-5xl mx-auto px-4">
        {category.h1 && (
          <h2 className="text-2xl font-bold text-gray-800 mb-4">{category.h1}</h2>
        )}
        {category.introContent && (
          <p className="text-gray-600 leading-relaxed mb-6 text-base">{category.introContent}</p>
        )}
        {category.seoContent && (
          <div className="prose prose-gray max-w-none mb-8 text-sm text-gray-600 leading-relaxed">
            {category.seoContent.split('\n\n').map((para, i) => (
              <p key={i} className="mb-3">{para}</p>
            ))}
          </div>
        )}
        {category.faqs && category.faqs.length > 0 && (
          <div className="mt-8">
            <h3 className="text-xl font-semibold text-gray-800 mb-4">
              Frequently Asked Questions
            </h3>
            <div className="space-y-4">
              {category.faqs.map((faq, i) => (
                <div key={i} className="bg-white rounded-lg border border-gray-200 p-4">
                  <p className="font-medium text-gray-800 mb-2">{faq.question}</p>
                  <p className="text-gray-600 text-sm">{faq.answer}</p>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </section>
  );
}
