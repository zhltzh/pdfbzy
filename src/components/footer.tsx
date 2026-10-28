import Link from "next/link";
import { FileText } from "lucide-react";
import { categories, availableTools, getToolBySlug } from "@/config/tools";
import { BUILT_TOOL_SLUGS } from "@/config/built-tools";
import { SiteNetwork } from "@/components/site-network";

// 已构建的工具（避免链接到未开发页面）
const builtTools = availableTools.filter((t) =>
  BUILT_TOOL_SLUGS.includes(t.slug as (typeof BUILT_TOOL_SLUGS)[number])
);

export function Footer() {
  return (
    <footer className="border-t bg-gray-50">
      <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        <div className="grid grid-cols-2 gap-8 md:grid-cols-4">
          {/* Brand */}
          <div className="col-span-2 md:col-span-1">
            <Link href="/" className="flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-white">
                <FileText className="h-4 w-4" />
              </div>
              <span className="text-lg font-bold text-gray-900">
                PDF<span className="text-primary">Bzy</span>
              </span>
            </Link>
            <p className="mt-3 text-sm text-gray-500">
              免费在线 PDF 工具平台。
              合并、拆分、转换、编辑、签名 PDF，全部免费，无需注册。
            </p>
          </div>

          {/* Categories */}
          {categories.map((cat) => {
            const catTools = builtTools.filter(
              (t) => t.category === cat.id
            );
            return (
              <div key={cat.id}>
                <h3 className="text-sm font-semibold text-gray-900">
                  {cat.name}
                </h3>
                <ul className="mt-3 space-y-2">
                  {catTools.map((tool) => (
                    <li key={tool.id}>
                      <Link
                        href={`/${tool.slug}`}
                        className="text-sm text-gray-500 hover:text-primary transition-colors"
                      >
                        {tool.name}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            );
          })}
        </div>

        {/* 底部信息 */}
        <div className="mt-8 border-t pt-8">
          <div className="flex flex-col items-center justify-between gap-4 sm:flex-row">
            <div className="flex flex-wrap items-center justify-center gap-x-6 gap-y-2 text-sm">
              <Link href="/about" className="text-gray-500 hover:text-primary transition-colors">
                关于我们
              </Link>
              <Link href="/privacy" className="text-gray-500 hover:text-primary transition-colors">
                隐私政策
              </Link>
              <Link href="/terms" className="text-gray-500 hover:text-primary transition-colors">
                使用条款
              </Link>
              <Link href="/contact" className="text-gray-500 hover:text-primary transition-colors">
                联系我们
              </Link>
            </div>
            <p className="text-center text-sm text-gray-400">
              &copy; {new Date().getFullYear()} PDFBzy. All rights reserved.
            </p>
          </div>
        </div>

        <SiteNetwork />
      </div>
    </footer>
  );
}
