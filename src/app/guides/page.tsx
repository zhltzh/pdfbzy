import type { Metadata } from "next";
import Link from "next/link";
import { ChevronRight, ArrowRight, BookOpen } from "lucide-react";
import { GUIDES } from "@/config/guides";

const url = "https://pdf.aixuno.com/guides/";

export const metadata: Metadata = {
  title: {
    absolute: "PDF 使用教程 - 免费在线 PDF 工具",
  },
  description:
    "PDFBzy 出品的 PDF 使用教程：压缩到 1MB、提取页面、扫描件转文字、加水印、合并、加页码、转 JPG、删除密码，每篇都给出可直接照做的步骤和对应免费工具。",
  alternates: { canonical: url },
  openGraph: {
    title: "PDF 使用教程 - 免费在线 PDF 工具 | PDFBzy",
    description:
      "8 篇 PDF 实操教程，覆盖压缩、拆分提取、OCR、水印、合并、页码、转图片、解密，全部附免费在线工具。",
    url,
    siteName: "PDFBzy",
    type: "website",
    locale: "zh_CN",
    images: [{ url: "/og-image.png", width: 1200, height: 630, alt: "PDF 使用教程" }],
  },
  twitter: {
    card: "summary_large_image",
    title: "PDF 使用教程 - 免费在线 PDF 工具 | PDFBzy",
    description: "8 篇 PDF 实操教程，每篇都附可直接使用的免费在线工具。",
    images: ["/og-image.png"],
  },
};

export default function GuidesPage() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white">
      {/* 面包屑 */}
      <div className="border-b bg-white/80 backdrop-blur-sm">
        <div className="mx-auto max-w-5xl px-4 py-3 sm:px-6">
          <nav className="flex items-center gap-1.5 text-sm text-gray-500">
            <Link href="/" className="transition-colors hover:text-primary">
              首页
            </Link>
            <ChevronRight className="h-3.5 w-3.5" />
            <span className="font-medium text-gray-900">教程</span>
          </nav>
        </div>
      </div>

      {/* 头部 */}
      <div className="border-b bg-white">
        <div className="mx-auto max-w-5xl px-4 py-10 text-center sm:px-6 sm:py-12">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/10 text-primary">
            <BookOpen className="h-6 w-6" />
          </div>
          <h1 className="mt-4 text-2xl font-bold text-gray-900 sm:text-3xl">
            PDF 使用教程
          </h1>
          <p className="mx-auto mt-3 max-w-2xl text-[15px] leading-7 text-gray-500">
            每个问题都给出可直接照做的步骤，并配好对应的免费在线工具。全部在浏览器本地处理，文件不上传服务器。
          </p>
          <div className="mt-4 flex flex-wrap items-center justify-center gap-4 text-sm text-gray-400">
            <span>{GUIDES.length} 篇实操教程</span>
            <span>每篇 3–5 个常见问题</span>
            <span>全部免费</span>
          </div>
        </div>
      </div>

      {/* 教程卡片 */}
      <div className="mx-auto max-w-5xl px-4 py-10 sm:px-6 sm:py-12">
        <div className="grid gap-4 sm:grid-cols-2">
          {GUIDES.map((guide) => (
            <Link
              key={guide.slug}
              href={`/guides/${guide.slug}/`}
              className="group flex flex-col rounded-2xl border bg-white p-5 shadow-sm transition-all hover:-translate-y-0.5 hover:shadow-lg"
            >
              <h2 className="text-base font-semibold leading-6 text-gray-900 transition-colors group-hover:text-primary">
                {guide.title}
              </h2>
              <p className="mt-2 flex-1 text-sm leading-6 text-gray-500">
                {guide.summary}
              </p>
              <div className="mt-4 flex items-center justify-between text-xs text-gray-400">
                <span>对应工具：{guide.toolName}</span>
                <span className="inline-flex items-center gap-1 font-medium text-primary">
                  阅读
                  <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5" />
                </span>
              </div>
            </Link>
          ))}
        </div>

        {/* 底部引导 */}
        <div className="mt-12 rounded-2xl border bg-white p-6 text-center">
          <h2 className="text-lg font-bold text-gray-900">想直接开始处理文件？</h2>
          <p className="mt-2 text-sm text-gray-500">
            教程里提到的所有工具都是免费的，无需注册，打开即可使用。
          </p>
          <Link
            href="/tools"
            className="mt-4 inline-flex items-center gap-1.5 rounded-xl bg-primary px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-primary-700"
          >
            浏览所有 PDF 工具
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>

        {/* CollectionPage JSON-LD */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@type": "CollectionPage",
              name: "PDF 使用教程",
              description:
                "PDFBzy 出品的 PDF 实操教程，覆盖压缩、提取、OCR、水印、合并、页码、转图片与解密。",
              url,
              inLanguage: "zh-CN",
              isPartOf: {
                "@type": "WebSite",
                name: "PDFBzy",
                url: "https://pdf.aixuno.com/",
              },
              hasPart: GUIDES.map((guide) => ({
                "@type": "Article",
                headline: guide.title,
                description: guide.description,
                url: `https://pdf.aixuno.com/guides/${guide.slug}/`,
                datePublished: guide.datePublished,
                dateModified: guide.dateModified,
              })),
            }),
          }}
        />
      </div>
    </div>
  );
}
