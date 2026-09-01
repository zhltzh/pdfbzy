import type { Metadata } from "next";
import Link from "next/link";
import { categories, availableTools, type ToolDefinition } from "@/config/tools";
import { BUILT_TOOL_SLUGS, BUILT_TOOL_COUNT } from "@/config/built-tools";
import { ArrowRight } from "lucide-react";

const builtTools = availableTools.filter((t) =>
  BUILT_TOOL_SLUGS.includes(t.slug as (typeof BUILT_TOOL_SLUGS)[number])
);

export const metadata: Metadata = {
  title: {
    absolute: `所有 PDF 在线工具 - ${BUILT_TOOL_COUNT}+ 种免费 PDF 处理工具`,
  },
  description:
    `PDFBzy 提供 ${BUILT_TOOL_COUNT}+ 种免费在线 PDF 工具，包括合并、拆分、压缩、转换、编辑、签名等功能。全部免费使用，无需注册，浏览器本地处理。`,
  alternates: { canonical: "https://pdfbzy.com/tools" },
  openGraph: {
    title: "所有 PDF 在线工具 - PDFBzy",
    description: `${BUILT_TOOL_COUNT}+ 种免费在线 PDF 工具，全部在浏览器本地处理，保护隐私。`,
    url: "https://pdfbzy.com/tools",
    images: [{ url: "/og-image.png", width: 1200, height: 630, alt: "PDFBzy 所有 PDF 在线工具" }],
  },
};

function ToolCard({ tool }: { tool: ToolDefinition }) {
  return (
    <Link
      href={`/${tool.slug}`}
      className="group flex items-center gap-4 rounded-2xl border bg-white p-5 shadow-sm transition-all hover:shadow-lg hover:-translate-y-0.5"
    >
      <div
        className={`flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-xl bg-gradient-to-br ${tool.color} text-white shadow-sm`}
      >
        <tool.icon className="h-6 w-6" />
      </div>
      <div className="min-w-0 flex-1">
        <h3 className="font-semibold text-gray-900 group-hover:text-primary transition-colors">
          {tool.name}
        </h3>
        <p className="mt-0.5 text-sm text-gray-400 line-clamp-1">
          {tool.description}
        </p>
      </div>
      <ArrowRight className="h-5 w-5 flex-shrink-0 text-gray-200 group-hover:text-primary transition-all group-hover:translate-x-0.5" />
    </Link>
  );
}

export default function ToolsPage() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white">
      {/* 头部 */}
      <div className="border-b bg-white">
        <div className="mx-auto max-w-6xl px-4 py-12 sm:px-6 lg:px-8 text-center">
          <h1 className="text-3xl font-bold text-gray-900 sm:text-4xl">
            所有 PDF 在线工具
          </h1>
          <p className="mt-3 text-lg text-gray-500 max-w-2xl mx-auto">
            免费在线处理 PDF 文件，全部工具无需注册、无需上传服务器，即用即走
          </p>
          <div className="mt-6 flex flex-wrap items-center justify-center gap-4 text-sm text-gray-400">
            <span className="flex items-center gap-1">✅ {builtTools.length}+ 种工具</span>
            <span className="flex items-center gap-1">🔒 浏览器本地处理</span>
            <span className="flex items-center gap-1">🆓 完全免费</span>
            <span className="flex items-center gap-1">⚡ 无需注册</span>
          </div>
        </div>
      </div>

      {/* 分类工具网格 */}
      <div className="mx-auto max-w-6xl px-4 py-12 sm:px-6 lg:px-8">
        {categories.map((cat) => {
          const catTools = builtTools.filter(
            (t) => t.category === cat.id
          );
          if (catTools.length === 0) return null;
          return (
            <div key={cat.id} className="mb-14 last:mb-0" id={cat.id}>
              <div className="mb-5">
                <h2 className="text-xl font-bold text-gray-900">
                  {cat.name}
                </h2>
                <p className="text-sm text-gray-400">{cat.description}</p>
              </div>
              <div className="grid gap-3.5 sm:grid-cols-2 lg:grid-cols-3">
                {catTools.map((tool) => (
                  <ToolCard key={tool.id} tool={tool} />
                ))}
              </div>
            </div>
          );
        })}

        {/* 底部提示 */}
        <div className="mt-16 rounded-2xl bg-gradient-to-r from-blue-50 to-purple-50 border p-8 text-center">
          <h3 className="text-xl font-bold text-gray-900">没有找到需要的工具？</h3>
          <p className="mt-2 text-gray-500">
            我们正在持续增加新工具。如果你有特定的 PDF 处理需求，欢迎向我们反馈。
          </p>
          <div className="mt-6 inline-flex items-center gap-2 text-sm text-primary font-medium">
            更多工具开发中...
          </div>
        </div>
      </div>
    </div>
  );
}
