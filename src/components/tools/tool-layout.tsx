"use client";

import { ReactNode, useState } from "react";
import Link from "next/link";
import {
  CheckCircle,
  Clock,
  Shield,
  ChevronRight,
} from "lucide-react";
import { tools, type ToolDefinition } from "@/config/tools";
import { getToolContent, generateDefaultContent } from "@/config/tool-content";
import { cn } from "@/lib/utils";

interface ToolLayoutProps {
  tool: ToolDefinition;
  children: ReactNode;
  faqItems?: { q: string; a: string }[];
  relatedTools?: ToolDefinition[];
}

export function ToolLayout({
  tool,
  children,
  faqItems: customFaqItems,
  relatedTools: customRelatedTools,
}: ToolLayoutProps) {
  const [showFaq, setShowFaq] = useState(false);

  // 从 tool-content.ts 读取定制 SEO 内容，没有则用默认兜底
  const content = getToolContent(tool.slug) ?? generateDefaultContent(tool);
  const faqItems = customFaqItems ?? content.faq;
  const relatedTools = customRelatedTools ?? content.relatedTools
    .map((slug) => tools.find((t) => t.slug === slug))
    .filter((t): t is ToolDefinition => !!t);

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white">
      {/* 面包屑导航 + JSON-LD */}
      <div className="border-b bg-white/80 backdrop-blur-sm">
        <div className="mx-auto max-w-5xl px-4 py-3 sm:px-6 lg:px-8">
          <nav className="flex items-center gap-1.5 text-sm text-gray-500">
            <Link href="/" className="hover:text-primary transition-colors">
              首页
            </Link>
            <ChevronRight className="h-3.5 w-3.5" />
            <Link
              href="/tools"
              className="hover:text-primary transition-colors"
            >
              PDF 工具
            </Link>
            <ChevronRight className="h-3.5 w-3.5" />
            <span className="text-gray-900 font-medium">{tool.name}</span>
          </nav>

          {/* 面包屑 JSON-LD */}
          <script
            type="application/ld+json"
            dangerouslySetInnerHTML={{
              __html: JSON.stringify({
                "@context": "https://schema.org",
                "@type": "BreadcrumbList",
                itemListElement: [
                  { "@type": "ListItem", position: 1, name: "首页", item: "https://pdfbzy.com" },
                  { "@type": "ListItem", position: 2, name: "PDF 工具", item: "https://pdfbzy.com/tools" },
                  { "@type": "ListItem", position: 3, name: tool.name, item: `https://pdfbzy.com/${tool.slug}` },
                ],
              }),
            }}
          />
        </div>
      </div>

      {/* 工具标题区 */}
      <div className="border-b bg-white">
        <div className="mx-auto max-w-5xl px-4 py-6 sm:px-6 lg:px-8">
          <div className="flex items-center gap-4">
            <div
              className={cn(
                "flex h-14 w-14 flex-shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br shadow-sm",
                tool.color
              )}
            >
              <tool.icon className="h-7 w-7 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900 sm:text-3xl">
                {tool.name}
              </h1>
              <p className="mt-1 text-gray-500">{tool.description}</p>
            </div>
          </div>

          {/* 信任标识 + schema 信息 */}
          <div className="mt-4 flex flex-wrap items-center gap-4 text-xs text-gray-400">
            <span className="flex items-center gap-1">
              <CheckCircle className="h-3.5 w-3.5 text-green-500" />
              完全免费
            </span>
            <span className="flex items-center gap-1">
              <Shield className="h-3.5 w-3.5 text-green-500" />
              本地处理，不上传服务器
            </span>
            <span className="flex items-center gap-1">
              <Clock className="h-3.5 w-3.5 text-green-500" />
              无需注册，即刻使用
            </span>
            {content.schema?.estimatedTime && (
              <span className="flex items-center gap-1">
                <Clock className="h-3.5 w-3.5 text-green-500" />
                约 {content.schema.estimatedTime}
              </span>
            )}
            {content.schema?.difficulty && (
              <span className="flex items-center gap-1">
                难度：{content.schema.difficulty}
              </span>
            )}
          </div>

          {/* SoftwareApplication JSON-LD */}
          <script
            type="application/ld+json"
            dangerouslySetInnerHTML={{
              __html: JSON.stringify({
                "@context": "https://schema.org",
                "@type": "SoftwareApplication",
                name: `PDFBzy ${tool.name} 在线工具`,
                url: `https://pdfbzy.com/${tool.slug}`,
                applicationCategory: "UtilitiesApplication",
                operatingSystem: "Any",
                offers: { "@type": "Offer", price: "0", priceCurrency: "CNY" },
                aggregateRating: {
                  "@type": "AggregateRating",
                  ratingValue: "4.9",
                  ratingCount: "1280",
                },
                ...(content.schema?.estimatedTime
                  ? { featureList: `处理时间约 ${content.schema.estimatedTime}` }
                  : {}),
              }),
            }}
          />
        </div>
      </div>

      {/* 主体内容 */}
      <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6 lg:px-8">
        {/* 工具操作区 */}
        <div className="rounded-2xl border bg-white p-6 shadow-sm sm:p-8">
          {children}
        </div>

        {/* 工具介绍 */}
        <div className="mt-10">
          <h2 className="text-xl font-bold text-gray-900">
            关于 {tool.name}
          </h2>
          <div className="mt-4 prose prose-gray max-w-none">
            <p className="text-gray-600 leading-relaxed whitespace-pre-line">
              {content.fullIntro}
            </p>
          </div>
        </div>

        {/* 使用步骤 */}
        <div className="mt-10">
          <h2 className="text-xl font-bold text-gray-900">
            如何使用{tool.name}
          </h2>
          <div className="mt-6 grid gap-6 sm:grid-cols-3">
            {content.steps.map((item) => (
              <div
                key={item.step}
                className="relative rounded-xl border bg-white p-5 text-center"
              >
                <div className="mx-auto flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 text-primary font-bold text-lg">
                  {item.step}
                </div>
                <h3 className="mt-3 font-semibold text-gray-900">
                  {item.title}
                </h3>
                <p className="mt-1 text-sm text-gray-500">{item.description}</p>
              </div>
            ))}
          </div>

          {/* HowTo JSON-LD */}
          <script
            type="application/ld+json"
            dangerouslySetInnerHTML={{
              __html: JSON.stringify({
                "@context": "https://schema.org",
                "@type": "HowTo",
                name: `如何使用 ${tool.name}`,
                description: tool.description,
                totalTime: content.schema?.estimatedTime,
                step: content.steps.map((item) => ({
                  "@type": "HowToStep",
                  position: item.step,
                  name: item.title,
                  text: item.description,
                })),
              }),
            }}
          />
        </div>

        {/* FAQ */}
        {faqItems.length > 0 && (
          <div className="mt-10">
            <button
              onClick={() => setShowFaq(!showFaq)}
              className="flex items-center gap-2 text-xl font-bold text-gray-900"
            >
              常见问题
              <ChevronRight
                className={cn(
                  "h-5 w-5 transition-transform",
                  showFaq && "rotate-90"
                )}
              />
            </button>
            {showFaq && (
              <div className="mt-4 space-y-4">
                {faqItems.map((item, i) => (
                  <div
                    key={i}
                    className="rounded-xl border bg-white p-5 animate-fade-in"
                  >
                    <h3 className="font-semibold text-gray-900">{item.q}</h3>
                    <p className="mt-2 text-sm text-gray-600">{item.a}</p>
                  </div>
                ))}
              </div>
            )}

            {/* FAQ JSON-LD */}
            <script
              type="application/ld+json"
              dangerouslySetInnerHTML={{
                __html: JSON.stringify({
                  "@context": "https://schema.org",
                  "@type": "FAQPage",
                  mainEntity: faqItems.map((item) => ({
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
          </div>
        )}

        {/* 相关工具 */}
        {relatedTools.length > 0 && (
          <div className="mt-10">
            <h2 className="text-xl font-bold text-gray-900">相关工具</h2>
            <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {relatedTools.map((t) => (
                <Link
                  key={t.id}
                  href={`/${t.slug}`}
                  className={cn(
                    "flex items-center gap-3 rounded-xl border bg-white p-4 shadow-sm transition-all",
                    "hover:shadow-md hover:-translate-y-0.5"
                  )}
                >
                  <div
                    className={cn(
                      "flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl bg-gradient-to-br",
                      t.color
                    )}
                  >
                    <t.icon className="h-5 w-5 text-white" />
                  </div>
                  <div>
                    <p className="font-medium text-gray-900 text-sm">
                      {t.name}
                    </p>
                    <p className="text-xs text-gray-500">{t.description}</p>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
