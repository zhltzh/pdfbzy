import Link from "next/link";
import {
  ArrowRight,
  FileText,
  Shield,
  Zap,
  Globe,
  Star,
  ChevronRight,
  ChevronDown,
  Sparkles,
  Upload,
  Download,
  MousePointerClick,
  Layers,
  BadgeCheck,
  Lock,
  UserCheck,
} from "lucide-react";
import { availableTools, categories, type ToolDefinition } from "@/config/tools";
import { BUILT_TOOL_SLUGS, BUILT_TOOL_COUNT } from "@/config/built-tools";

const builtTools = availableTools.filter((t) =>
  BUILT_TOOL_SLUGS.includes(t.slug as (typeof BUILT_TOOL_SLUGS)[number])
);

function ToolCard({ tool }: { tool: ToolDefinition }) {
  return (
    <Link
      href={`/${tool.slug}`}
      className="group relative flex flex-col items-center rounded-2xl border-2 border-transparent bg-white p-6 shadow-sm transition-all hover:shadow-lg hover:-translate-y-1 hover:border-primary/20"
    >
      <div
        className={`flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br ${tool.color} text-white shadow-sm transition-transform group-hover:scale-110 duration-200`}
      >
        <tool.icon className="h-7 w-7" />
      </div>
      <h3 className="mt-4 text-sm font-semibold text-gray-900 group-hover:text-primary transition-colors">
        {tool.name}
      </h3>
      <p className="mt-1.5 text-center text-xs text-gray-400 line-clamp-2 leading-relaxed">
        {tool.description}
      </p>
    </Link>
  );
}

// 统计数字（在线工具数为真实已实现数量）
const stats = [
  { label: "在线工具", value: `${BUILT_TOOL_COUNT}+`, icon: Layers },
  { label: "免费使用", value: "100%", icon: BadgeCheck },
  { label: "浏览器本地处理", value: "100%", icon: Lock },
  { label: "无需注册", value: "0 门槛", icon: UserCheck },
];

const features = [
  {
    icon: FileText,
    title: "完全免费",
    desc: "所有工具永久免费使用，无水印、无次数限制、无需付费。",
  },
  {
    icon: Shield,
    title: "隐私安全",
    desc: "文件在浏览器本地处理，不会上传到任何服务器，保护你的文档安全。",
  },
  {
    icon: Zap,
    title: "快速高效",
    desc: "无需下载安装，无需注册账号，打开浏览器即可使用。",
  },
  {
    icon: Globe,
    title: "全平台支持",
    desc: "Windows、Mac、Linux、手机、平板，有浏览器就能用。",
  },
  {
    icon: Star,
    title: "高质量输出",
    desc: "采用专业 PDF 引擎处理，确保输出质量和排版准确。",
  },
  {
    icon: Sparkles,
    title: "持续更新",
    desc: "持续增加新工具和新功能，满足你的各种 PDF 处理需求。",
  },
];

export default function Home() {
  return (
    <div>
      {/* ===== HERO ===== 纯净第一屏：badge + 标题 + 描述 + 2 按钮 */}
      <section className="relative overflow-hidden bg-gradient-to-b from-blue-50/80 via-white to-white">
        {/* 背景装饰（极简） */}
        <div className="pointer-events-none absolute inset-0" aria-hidden="true">
          <div className="absolute -top-24 left-1/2 h-72 w-72 -translate-x-1/2 rounded-full bg-blue-100/50 blur-3xl" />
        </div>

        <div className="relative mx-auto max-w-4xl px-4 py-24 sm:px-6 lg:px-8 lg:py-32">
          <div className="text-center">
            <div className="inline-flex items-center gap-1.5 rounded-full bg-blue-50 border border-blue-100 px-4 py-1.5 text-xs font-medium text-blue-600">
              <Sparkles className="h-3.5 w-3.5" />
              完全免费 · 无需注册 · 即用即走
            </div>

            <h1 className="mt-8 text-4xl font-extrabold tracking-tight text-gray-900 sm:text-5xl lg:text-6xl leading-tight">
              PDF 处理，
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-purple-600">
                就这么简单
              </span>
            </h1>

            <p className="mx-auto mt-6 max-w-2xl text-lg text-gray-500 leading-relaxed">
              PDFBzy 提供免费在线 PDF 工具。
              合并、拆分、转换、编辑、签名……全部在浏览器本地完成，不上传服务器。
            </p>
          </div>
        </div>
      </section>

      {/* ===== 工具分类展示 ===== */}
      <section className="pt-28 pb-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold text-gray-900 sm:text-4xl">
              所有 PDF 工具，一应俱全
            </h2>
            <p className="mt-4 text-lg text-gray-500 max-w-2xl mx-auto">
              从编辑、转换到安全保护，满足你所有的 PDF 处理需求
            </p>
          </div>

          {categories.map((cat) => {
            const catTools = builtTools.filter(
              (t) => t.category === cat.id
            );
            if (catTools.length === 0) return null;
            return (
              <div key={cat.id} className="mb-16 last:mb-0" id={cat.id}>
                <div className="mb-6 flex items-center justify-between">
                  <div>
                    <h3 className="text-xl font-bold text-gray-900">
                      {cat.name}
                    </h3>
                    <p className="text-sm text-gray-400">{cat.description}</p>
                  </div>
                  <Link
                    href={`/tools#${cat.id}`}
                    className="hidden sm:flex items-center gap-1 text-sm font-medium text-primary hover:text-primary/80 transition-colors"
                  >
                    查看全部
                    <ChevronRight className="h-4 w-4" />
                  </Link>
                </div>
                <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
                  {catTools.slice(0, 10).map((tool) => (
                    <ToolCard key={tool.id} tool={tool} />
                  ))}
                </div>
              </div>
            );
          })}

          <div className="text-center mt-10">
            <Link
              href="/tools"
              className="inline-flex items-center gap-2 rounded-xl border-2 bg-white px-8 py-3.5 text-base font-semibold text-gray-700 hover:bg-gray-50 hover:border-gray-300 transition-all"
            >
              查看全部工具
              <ChevronRight className="h-4 w-4" />
            </Link>
          </div>
        </div>
      </section>

      {/* ===== 使用流程 ===== */}
      <section className="border-t bg-white py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-14">
            <h2 className="text-3xl font-bold text-gray-900 sm:text-4xl">
              三步完成 PDF 处理
            </h2>
            <p className="mt-4 text-lg text-gray-500">
              无需注册，无需下载，打开浏览器即可使用
            </p>
          </div>
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-3 max-w-4xl mx-auto">
            {[
              { icon: Upload, step: "1", title: "上传文件", desc: "拖拽或点击选择你的 PDF 文件" },
              { icon: MousePointerClick, step: "2", title: "一键处理", desc: "点击按钮，自动完成处理" },
              { icon: Download, step: "3", title: "下载结果", desc: "处理完成后直接下载" },
            ].map((item) => (
              <div key={item.step} className="group relative flex flex-col items-center rounded-2xl bg-gradient-to-b from-gray-50 to-white border border-gray-100 p-8 transition-all hover:shadow-md hover:-translate-y-0.5">
                <div className="relative">
                  <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/10 text-primary transition-all group-hover:bg-primary group-hover:text-white">
                    <item.icon className="h-7 w-7" />
                  </div>
                  <span className="absolute -top-2 -right-2 flex h-6 w-6 items-center justify-center rounded-full bg-primary text-xs font-bold text-white">
                    {item.step}
                  </span>
                </div>
                <p className="mt-4 font-semibold text-gray-900">{item.title}</p>
                <p className="mt-1 text-xs text-gray-400 text-center">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ===== 为什么选择我们 ===== */}
      <section className="border-t bg-gray-50/50 py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-14">
            <h2 className="text-3xl font-bold text-gray-900 sm:text-4xl">
              为什么选择 PDFBzy？
            </h2>
          </div>
          <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
            {features.map((feature, i) => (
              <div
                key={i}
                className="group rounded-2xl border bg-white p-7 shadow-sm hover:shadow-md transition-all hover:-translate-y-0.5"
              >
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/10 text-primary group-hover:bg-primary group-hover:text-white transition-all">
                  <feature.icon className="h-6 w-6" />
                </div>
                <h3 className="mt-5 font-semibold text-gray-900 text-lg">
                  {feature.title}
                </h3>
                <p className="mt-2 text-sm text-gray-400 leading-relaxed">
                  {feature.desc}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ===== 统计数字 ===== */}
      <section className="border-t bg-white py-16">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 gap-8 sm:grid-cols-4 max-w-3xl mx-auto">
            {stats.map((stat) => (
              <div key={stat.label} className="text-center group">
                <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/5 text-primary transition-all group-hover:bg-primary group-hover:text-white">
                  <stat.icon className="h-6 w-6" />
                </div>
                <p className="mt-3 text-3xl font-bold text-gray-900">{stat.value}</p>
                <p className="mt-1 text-sm text-gray-400">{stat.label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ===== FAQ 常见问题 ===== */}
      <section className="border-t bg-gray-50/50 py-20">
        <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 sm:text-4xl">
              常见问题
            </h2>
            <p className="mt-4 text-lg text-gray-500">
              关于 PDFBzy，你可能想知道这些
            </p>
          </div>
          <div className="space-y-4">
            {[
              {
                q: "PDFBzy 是免费的吗？",
                a: "是的，PDFBzy 的所有工具都永久免费使用，无水印、无次数限制、无需付费订阅。我们希望通过免费的工具帮助用户轻松处理 PDF 文件。",
              },
              {
                q: "我的文件会上传到服务器吗？",
                a: "不会。PDFBzy 的所有工具都在浏览器本地处理文件，你的 PDF 和图片数据不会上传到任何服务器，从源头保障文档隐私安全，即使离线断开网络，已上传的文件也能被完整处理。",
              },
              {
                q: "需要注册账号才能使用吗？",
                a: "不需要。PDFBzy 无需注册、无需登录，打开浏览器即可使用所有工具，即用即走，不留下任何个人信息。",
              },
              {
                q: "PDFBzy 支持哪些设备？",
                a: "PDFBzy 基于 Web 技术构建，支持 Windows、macOS、Linux、Android、iOS 等所有主流平台，只要有浏览器就能使用，包括 Chrome、Edge、Safari、Firefox 等。",
              },
              {
                q: "可以处理多大的 PDF 文件？",
                a: "单个文件最大支持 50MB。绝大多数日常文档都在此范围内。对于超大文件，建议先拆分或压缩后再处理。",
              },
              {
                q: "PDFBzy 支持哪些 PDF 操作？",
                a: `目前提供 ${BUILT_TOOL_COUNT}+ 种工具，覆盖合并、拆分、旋转、删除、提取、裁剪、重排、插入、加密解密、签名、图片转换等常用功能，并且持续新增中。`,
              },
            ].map((item) => (
              <details
                key={item.q}
                className="group rounded-xl border bg-white p-5 shadow-sm open:shadow-md transition-shadow"
              >
                <summary className="flex cursor-pointer items-center justify-between gap-4 list-none">
                  <span className="font-medium text-gray-900 group-open:text-primary transition-colors">
                    {item.q}
                  </span>
                  <ChevronDown className="h-5 w-5 flex-shrink-0 text-gray-400 transition-transform group-open:rotate-180" />
                </summary>
                <p className="mt-3 text-sm text-gray-500 leading-relaxed">
                  {item.a}
                </p>
              </details>
            ))}
          </div>
        </div>
      </section>

      {/* FAQPage JSON-LD（GEO 结构化数据） */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "FAQPage",
            mainEntity: [
              {
                "@type": "Question",
                name: "PDFBzy 是免费的吗？",
                acceptedAnswer: {
                  "@type": "Answer",
                  text: "是的，PDFBzy 的所有工具都永久免费使用，无水印、无次数限制、无需付费订阅。",
                },
              },
              {
                "@type": "Question",
                name: "我的文件会上传到服务器吗？",
                acceptedAnswer: {
                  "@type": "Answer",
                  text: "不会。PDFBzy 的所有工具都在浏览器本地处理文件，PDF 和图片数据不会上传到任何服务器，保障文档隐私安全。",
                },
              },
              {
                "@type": "Question",
                name: "需要注册账号才能使用吗？",
                acceptedAnswer: {
                  "@type": "Answer",
                  text: "不需要。PDFBzy 无需注册、无需登录，打开浏览器即可使用所有工具，即用即走。",
                },
              },
              {
                "@type": "Question",
                name: "PDFBzy 支持哪些设备？",
                acceptedAnswer: {
                  "@type": "Answer",
                  text: "PDFBzy 基于 Web 技术构建，支持 Windows、macOS、Linux、Android、iOS 等所有主流平台，有浏览器就能使用。",
                },
              },
              {
                "@type": "Question",
                name: "可以处理多大的 PDF 文件？",
                acceptedAnswer: {
                  "@type": "Answer",
                  text: "单个文件最大支持 50MB。对于超大文件，建议先拆分或压缩后再处理。",
                },
              },
              {
                "@type": "Question",
                name: "PDFBzy 支持哪些 PDF 操作？",
                acceptedAnswer: {
                  "@type": "Answer",
                  text: `目前提供 ${BUILT_TOOL_COUNT}+ 种工具，覆盖合并、拆分、旋转、编辑、加密、签名、转换等常用功能，并持续新增。`,
                },
              },
            ],
          }),
        }}
      />

      {/* ===== CTA 底部 ===== */}
      <section className="relative overflow-hidden bg-gradient-to-r from-blue-600 to-blue-800 py-20">
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute -top-20 -right-20 h-60 w-60 rounded-full bg-white/5 blur-3xl" />
          <div className="absolute -bottom-20 -left-20 h-60 w-60 rounded-full bg-white/5 blur-3xl" />
        </div>
        <div className="relative mx-auto max-w-7xl px-4 text-center sm:px-6 lg:px-8">
          <h2 className="text-3xl font-bold text-white sm:text-4xl">
            开始免费使用 PDFBzy
          </h2>
          <p className="mx-auto mt-4 max-w-xl text-blue-100 text-lg">
            无需注册，无需下载，打开浏览器即可处理你的 PDF 文件。
          </p>
          <div className="mt-10 flex flex-wrap items-center justify-center gap-4">
            <Link
              href="/merge-pdf"
              className="inline-flex items-center gap-2 rounded-xl bg-white px-8 py-3.5 text-base font-semibold text-blue-600 shadow-lg hover:bg-blue-50 hover:-translate-y-0.5 transition-all"
            >
              立即开始
              <ArrowRight className="h-4 w-4" />
            </Link>
            <Link
              href="/tools"
              className="inline-flex items-center gap-2 rounded-xl border-2 border-white/30 px-8 py-3.5 text-base font-semibold text-white hover:bg-white/10 transition-all"
            >
              浏览所有工具
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
