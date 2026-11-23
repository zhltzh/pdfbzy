import Link from "next/link";
import { ChevronRight, ArrowRight, Wrench } from "lucide-react";
import { getGuideBySlug, GUIDE_LIST_PATH } from "@/config/guides";
import type { GuideMeta } from "@/config/guides";

interface GuideArticleProps {
  guide: GuideMeta;
  faq?: { q: string; a: string }[];
  children: React.ReactNode;
}

/** 文章内嵌的工具引导按钮 */
export function GuideToolCta({
  href,
  label,
  description,
}: {
  href: string;
  label: string;
  description: string;
}) {
  return (
    <div className="my-6 rounded-2xl border border-green-200 bg-green-50/70 p-5">
      <div className="flex items-start gap-3">
        <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl bg-green-600 text-white">
          <Wrench className="h-5 w-5" />
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-sm font-semibold text-gray-900">{label}</p>
          <p className="mt-1 text-sm leading-6 text-gray-600">{description}</p>
          <Link
            href={href}
            className="mt-3 inline-flex items-center gap-1.5 rounded-xl bg-green-600 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-green-700"
          >
            立即免费使用
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </div>
    </div>
  );
}

export function GuideArticle({ guide, faq, children }: GuideArticleProps) {
  const url = `https://pdf.aixuno.com/guides/${guide.slug}/`;
  const related = guide.related
    .map((slug) => getGuideBySlug(slug))
    .filter((g): g is GuideMeta => !!g);

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white">
      {/* 面包屑 + JSON-LD */}
      <div className="border-b bg-white/80 backdrop-blur-sm">
        <div className="mx-auto max-w-3xl px-4 py-3 sm:px-6">
          <nav className="flex flex-wrap items-center gap-1.5 text-sm text-gray-500">
            <Link href="/" className="transition-colors hover:text-primary">
              首页
            </Link>
            <ChevronRight className="h-3.5 w-3.5 flex-shrink-0" />
            <Link href={GUIDE_LIST_PATH} className="transition-colors hover:text-primary">
              教程
            </Link>
            <ChevronRight className="h-3.5 w-3.5 flex-shrink-0" />
            <span className="text-gray-900 font-medium">{guide.title}</span>
          </nav>

          <script
            type="application/ld+json"
            dangerouslySetInnerHTML={{
              __html: JSON.stringify({
                "@context": "https://schema.org",
                "@type": "BreadcrumbList",
                itemListElement: [
                  {
                    "@type": "ListItem",
                    position: 1,
                    name: "首页",
                    item: "https://pdf.aixuno.com/",
                  },
                  {
                    "@type": "ListItem",
                    position: 2,
                    name: "教程",
                    item: `https://pdf.aixuno.com${GUIDE_LIST_PATH}`,
                  },
                  {
                    "@type": "ListItem",
                    position: 3,
                    name: guide.title,
                    item: url,
                  },
                ],
              }),
            }}
          />
        </div>
      </div>

      <article className="mx-auto max-w-3xl px-4 pb-16 pt-8 sm:px-6">
        <header>
          <h1 className="text-2xl font-bold leading-snug text-gray-900 sm:text-3xl">
            {guide.title}
          </h1>
          <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-gray-400">
            <span>PDFBzy 教程</span>
            <time dateTime={guide.dateModified}>
              更新于 {guide.dateModified}
            </time>
            <span>约 6 分钟读完</span>
          </div>
        </header>

        <div className="mt-6 space-y-4 text-[15px] leading-8 text-gray-700 [&_a]:text-primary [&_a]:underline [&_a]:underline-offset-2 [&_h2]:mt-10 [&_h2]:text-xl [&_h2]:font-bold [&_h2]:leading-snug [&_h2]:text-gray-900 [&_h3]:mt-6 [&_h3]:text-base [&_h3]:font-semibold [&_h3]:text-gray-900 [&_li]:leading-7 [&_ol]:list-decimal [&_ol]:space-y-2 [&_ol]:pl-5 [&_strong]:font-semibold [&_strong]:text-gray-900 [&_ul]:list-disc [&_ul]:space-y-1.5 [&_ul]:pl-5">
          {children}
        </div>

        {faq && faq.length > 0 && (
          <section className="mt-12">
            <h2 className="text-xl font-bold text-gray-900">常见问题</h2>
            <div className="mt-4 space-y-3">
              {faq.map((item) => (
                <details
                  key={item.q}
                  className="group rounded-xl border bg-white px-5 py-4"
                >
                  <summary className="cursor-pointer list-none text-[15px] font-semibold text-gray-900 marker:content-none">
                    <span className="flex items-start justify-between gap-4">
                      {item.q}
                      <ChevronRight className="mt-0.5 h-4 w-4 flex-shrink-0 text-gray-400 transition-transform group-open:rotate-90" />
                    </span>
                  </summary>
                  <p className="mt-3 text-sm leading-7 text-gray-600">{item.a}</p>
                </details>
              ))}
            </div>

            <script
              type="application/ld+json"
              dangerouslySetInnerHTML={{
                __html: JSON.stringify({
                  "@context": "https://schema.org",
                  "@type": "FAQPage",
                  mainEntity: faq.map((item) => ({
                    "@type": "Question",
                    name: item.q,
                    acceptedAnswer: {
                      "@type": "Answer",
                      text: item.a,
                    },
                  })),
                }),
              }}
            />
          </section>
        )}

        {related.length > 0 && (
          <section className="mt-12 border-t pt-8">
            <h2 className="text-xl font-bold text-gray-900">相关教程</h2>
            <div className="mt-4 grid gap-3">
              {related.map((g) => (
                <Link
                  key={g.slug}
                  href={`/guides/${g.slug}/`}
                  className="group flex items-center justify-between gap-4 rounded-xl border bg-white p-4 transition-all hover:-translate-y-0.5 hover:shadow-md"
                >
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-gray-900 transition-colors group-hover:text-primary">
                      {g.title}
                    </p>
                    <p className="mt-1 line-clamp-1 text-xs text-gray-500">
                      {g.summary}
                    </p>
                  </div>
                  <ArrowRight className="h-4 w-4 flex-shrink-0 text-gray-300 transition-all group-hover:translate-x-0.5 group-hover:text-primary" />
                </Link>
              ))}
            </div>
            <p className="mt-6 text-sm text-gray-500">
              更多内容见
              <Link href={GUIDE_LIST_PATH} className="mx-1 text-primary hover:underline">
                全部 PDF 教程
              </Link>
              ，或直接前往
              <Link href={`/${guide.toolSlug}`} className="mx-1 text-primary hover:underline">
                {guide.toolName}
              </Link>
              工具页面。
            </p>
          </section>
        )}

        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@type": "Article",
              headline: guide.title,
              description: guide.description,
              url,
              mainEntityOfPage: {
                "@type": "WebPage",
                "@id": url,
              },
              image: ["https://pdf.aixuno.com/og-image.png"],
              datePublished: guide.datePublished,
              dateModified: guide.dateModified,
              inLanguage: "zh-CN",
              author: {
                "@type": "Organization",
                name: "PDFBzy",
                url: "https://pdf.aixuno.com/",
              },
              publisher: {
                "@type": "Organization",
                name: "PDFBzy",
                logo: {
                  "@type": "ImageObject",
                  url: "https://pdf.aixuno.com/favicon.png",
                },
              },
            }),
          }}
        />
      </article>
    </div>
  );
}
