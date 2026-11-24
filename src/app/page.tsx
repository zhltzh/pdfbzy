import Link from "next/link";
import {
  ArrowRight,
  FileText,
  Shield,
  Zap,
  Globe,
  Star,
  Sparkles,
  ChevronRight,
  ChevronDown,
  Upload,
  Download,
  MousePointerClick,
  FilePlus2,
  FileStack,
  FileType2,
  PenLine,
  FileArchive,
  FileKey2,
  type LucideIcon,
} from "lucide-react";
import { availableTools, categories, type ToolDefinition } from "@/config/tools";
import { BUILT_TOOL_SLUGS, BUILT_TOOL_COUNT } from "@/config/built-tools";
import { Reveal } from "@/components/reveal";

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
  { label: "本地处理", value: "100%" },
  { label: "字节上传", value: "0" },
  { label: "在线工具", value: `${BUILT_TOOL_COUNT}+` },
  { label: "使用门槛", value: "0" },
];

const scenes: [LucideIcon, string, string][] = [
  [FilePlus2, "合同归档合并", "把散落各处的合同、附件合并成一份完整 PDF，归档发送一步到位。"],
  [FileStack, "拆分与重组", "从报告中抽出某几页，或按章节拆成多个文件，页序自由调整。"],
  [FileType2, "格式互转", "图片一键转 PDF，PDF 也能导出成 JPG/PNG，跨设备查看不变形。"],
  [PenLine, "签字与盖章", "电子签名直接签署，加水印注明用途，正式文件快速出件。"],
  [FileArchive, "发送前瘦身", "压缩 PDF 到邮箱限额内，附件再也不会发送失败。"],
  [FileKey2, "敏感文件加密", "合同、证件加密加密码，重要文档本地处理不外泄。"],
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
      {/* ===== HERO ===== 深色渐变 + 徽章 + 合并演示卡 */}
      <section className="relative overflow-hidden bg-[#070b16]">
        {/* 网格底纹 */}
        <div
          className="pointer-events-none absolute inset-0 opacity-[0.55]"
          style={{
            backgroundImage:
              "linear-gradient(rgba(255,255,255,0.04) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.04) 1px, transparent 1px)",
            backgroundSize: "44px 44px",
            maskImage: "radial-gradient(75% 60% at 50% 0%, #000 30%, transparent 100%)",
            WebkitMaskImage: "radial-gradient(75% 60% at 50% 0%, #000 30%, transparent 100%)",
          }}
          aria-hidden="true"
        />
        <div className="pointer-events-none absolute -top-32 left-[-6rem] h-96 w-96 rounded-full bg-rose-500/20 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-32 right-[-4rem] h-96 w-96 rounded-full bg-blue-500/25 blur-3xl" />

        <div className="relative mx-auto grid max-w-6xl items-center gap-12 px-4 py-16 sm:px-6 lg:grid-cols-[1.05fr_0.95fr] lg:py-20">
          <div className="text-center lg:text-left">
            <div className="inline-flex items-center gap-2 rounded-full border border-blue-400/30 bg-blue-500/15 px-4 py-1.5 text-sm font-semibold text-blue-100">
              <span className="fp-pulse-dot h-2 w-2 rounded-full bg-emerald-400" />
              完全免费 · 无需注册 · 即用即走
            </div>

            <h1 className="mt-6 text-4xl font-extrabold leading-[1.12] tracking-tight text-white sm:text-5xl">
              PDF 处理，
              <span className="bg-gradient-to-r from-sky-300 via-blue-200 to-rose-300 bg-clip-text text-transparent">
                就这么简单
              </span>
            </h1>

            <p className="mx-auto mt-5 max-w-xl text-base text-blue-100/85 sm:text-lg lg:mx-0">
              PDFBzy 提供 {BUILT_TOOL_COUNT}+ 种免费在线 PDF 工具。
              合并、拆分、转换、编辑、签名……全部在浏览器本地完成，不上传服务器。
            </p>

            <div className="mt-5 flex flex-wrap justify-center gap-2 lg:justify-start">
              <span className="rounded-full border border-white/15 bg-white/[0.07] px-3.5 py-1 text-[13px] font-semibold text-slate-200">不上传</span>
              <span className="rounded-full border border-white/15 bg-white/[0.07] px-3.5 py-1 text-[13px] font-semibold text-slate-200">免注册</span>
              <span className="rounded-full border border-white/15 bg-white/[0.07] px-3.5 py-1 text-[13px] font-semibold text-slate-200">{BUILT_TOOL_COUNT}+ 个工具</span>
            </div>

            {/* 常用工具直达 */}
            <div className="mt-7 flex flex-wrap justify-center gap-2.5 lg:justify-start">
              {[
                { href: "/merge-pdf/", label: "合并 PDF" },
                { href: "/split-pdf/", label: "拆分 PDF" },
                { href: "/compress-pdf/", label: "压缩 PDF" },
                { href: "/pdf-to-jpg/", label: "PDF 转 JPG" },
              ].map((tool) => (
                <Link
                  key={tool.href}
                  href={tool.href}
                  className="rounded-xl border border-white/15 bg-white/[0.07] px-4 py-2.5 text-sm font-semibold text-slate-200 transition hover:-translate-y-0.5 hover:border-white/30 hover:bg-white/[0.13]"
                >
                  {tool.label}
                </Link>
              ))}
            </div>

            <div className="mt-6 flex flex-wrap justify-center gap-3 lg:justify-start">
              <Link
                href="/merge-pdf"
                className="rounded-xl bg-gradient-to-r from-blue-500 to-rose-500 px-6 py-3 text-[15px] font-bold text-white shadow-[0_12px_32px_rgba(59,110,242,0.45)] transition hover:-translate-y-0.5"
              >
                开始处理 PDF
              </Link>
              <Link
                href="/tools"
                className="rounded-xl border border-white/20 bg-white/[0.06] px-5 py-3 text-sm font-semibold text-slate-200 transition hover:bg-white/[0.12]"
              >
                浏览全部工具
              </Link>
            </div>
            <p className="mt-4 text-xs text-slate-400">手机电脑都能用 · 无需安装任何软件</p>
          </div>

          {/* 合并演示卡 */}
          <div className="mx-auto w-full max-w-md" aria-hidden="true">
            <div className="rounded-2xl border border-white/10 bg-[#0d1222]/90 p-6 shadow-[0_24px_64px_rgba(10,15,30,0.45)]">
              <div className="flex items-end justify-center gap-3 pt-2">
                <div className="fp-doc-a w-28 rounded-lg border border-white/10 bg-white/[0.07] p-3 text-center">
                  <FileText className="mx-auto h-6 w-6 text-blue-300" />
                  <p className="mt-2 truncate text-[11px] font-semibold text-slate-200">报告.pdf</p>
                  <p className="text-[10px] text-slate-400">2 页</p>
                </div>
                <div className="fp-doc-b w-28 rounded-lg border border-white/10 bg-white/[0.07] p-3 text-center">
                  <FileText className="mx-auto h-6 w-6 text-rose-300" />
                  <p className="mt-2 truncate text-[11px] font-semibold text-slate-200">附录.pdf</p>
                  <p className="text-[10px] text-slate-400">3 页</p>
                </div>
              </div>
              <svg viewBox="0 0 100 14" className="mx-auto mt-2 h-4 w-24 text-blue-300/60" preserveAspectRatio="none">
                <path d="M2 7 C 25 -4, 75 -4, 98 7" stroke="currentColor" strokeWidth="1.6" fill="none" strokeDasharray="3 3" />
                <path d="M2 7 C 25 18, 75 18, 98 7" stroke="currentColor" strokeWidth="1.6" fill="none" strokeDasharray="3 3" />
              </svg>
              <div className="fp-doc-merged mx-auto mt-2 w-40 rounded-xl bg-gradient-to-br from-blue-500 to-rose-500 p-3 text-center shadow-[0_10px_28px_rgba(99,102,241,0.4)]">
                <FileStack className="mx-auto h-7 w-7 text-white" />
                <p className="mt-1.5 text-xs font-bold text-white">合并.pdf · 5 页</p>
              </div>
              <p className="mt-4 text-center text-xs font-medium text-blue-200/80">本地合并 · 文件不出设备</p>
              <div className="mt-3 grid grid-cols-3 gap-2 text-center">
                <div className="rounded-lg border border-white/10 bg-white/[0.06] px-2 py-2 text-xs font-semibold text-slate-200">{BUILT_TOOL_COUNT}+ 工具</div>
                <div className="rounded-lg border border-white/10 bg-white/[0.06] px-2 py-2 text-xs font-semibold text-slate-200">100% 本地</div>
                <div className="rounded-lg border border-white/10 bg-white/[0.06] px-2 py-2 text-xs font-semibold text-slate-200">0 字节上传</div>
              </div>
            </div>
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


      {/* ===== 界面预览 ===== */}
      <section className="border-t bg-gray-50/50 py-16">
        <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8">
          <figure className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm">
            <img
              src="/tools-overview.webp"
              alt="PDFBzy 工具总览界面：合并、拆分、压缩、转换、编辑等 PDF 工具按用途分组排列"
              width="2560"
              height="4134"
              loading="lazy"
              decoding="async"
              className="h-auto w-full"
            />
          </figure>
          <p className="mt-4 text-center text-sm text-gray-500">
            22 个工具按用途分组，从编辑、转换到安全保护，都在同一个站点完成。
          </p>
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

      {/* ===== 使用场景 ===== */}
      <section className="border-t bg-white py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-14">
            <span className="text-xs font-extrabold uppercase tracking-[0.14em] text-primary">使用场景</span>
            <h2 className="mt-2 text-3xl font-bold text-gray-900 sm:text-4xl">
              什么时候需要 PDFBzy？
            </h2>
          </div>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {scenes.map(([Icon, title, desc]) => (
              <Reveal key={title}>
                <div className="flex h-full items-start gap-4 rounded-2xl border bg-white p-5 transition hover:-translate-y-1 hover:border-blue-200 hover:shadow-md">
                  <span className="flex h-11 w-11 flex-none items-center justify-center rounded-xl bg-primary/10 text-primary">
                    <Icon className="h-5 w-5" />
                  </span>
                  <div>
                    <h3 className="text-[15px] font-semibold text-gray-900">{title}</h3>
                    <p className="mt-1 text-sm text-gray-500">{desc}</p>
                  </div>
                </div>
              </Reveal>
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

      {/* ===== 对比表 ===== */}
      <section className="border-t bg-white py-20">
        <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <span className="text-xs font-extrabold uppercase tracking-[0.14em] text-primary">方案对比</span>
            <h2 className="mt-2 text-3xl font-bold text-gray-900 sm:text-4xl">
              为什么不用云端 PDF 网站？
            </h2>
            <p className="mx-auto mt-3 max-w-2xl text-gray-500">
              主流在线 PDF 工具要把你的文件先传到服务器。区别一目了然：
            </p>
          </div>
          <Reveal>
            <div className="overflow-x-auto rounded-2xl border shadow-sm">
              <table className="w-full border-collapse bg-white text-sm">
                <thead>
                  <tr className="bg-gray-50">
                    <th className="px-4 py-3.5 text-left font-semibold text-gray-900">能力</th>
                    <th className="bg-gradient-to-r from-blue-500 to-rose-500 px-4 py-3.5 text-center font-bold text-white">PDFBzy</th>
                    <th className="px-4 py-3.5 text-center font-semibold text-gray-600">云端 PDF 网站</th>
                    <th className="px-4 py-3.5 text-center font-semibold text-gray-600">桌面软件</th>
                  </tr>
                </thead>
                <tbody>
                  {[
                    ["文件离开设备", "绝不", "上传到服务器", "不会"],
                    ["免费与限制", "全免费 · 无次数限制", "免费版常有大小/次数限制", "专业版需付费"],
                    ["隐私敏感文件", "理想", "建议先读隐私政策", "尚可"],
                    ["打开即用", "任意浏览器", "需等待上传下载", "需下载安装"],
                    ["处理速度", "本地即时", "受网络带宽影响", "本地即时"],
                  ].map((row) => (
                    <tr key={row[0]} className="border-t">
                      <td className="px-4 py-3.5 font-semibold text-gray-800">{row[0]}</td>
                      <td className="bg-gradient-to-b from-blue-50 to-rose-50 px-4 py-3.5 text-center font-bold text-emerald-600">✓ {row[1]}</td>
                      <td className="px-4 py-3.5 text-center text-gray-500">{row[2]}</td>
                      <td className="px-4 py-3.5 text-center text-gray-500">{row[3]}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Reveal>
        </div>
      </section>

      {/* ===== 统计数字（深色数据带） ===== */}
      <section className="border-t bg-white py-14">
        <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 gap-4 rounded-3xl bg-[#0b1020] p-8 text-center sm:p-10 lg:grid-cols-4">
            {stats.map((stat) => (
              <div key={stat.label}>
                <b className="block bg-gradient-to-r from-sky-300 to-rose-300 bg-clip-text text-4xl font-extrabold tracking-tight text-transparent sm:text-5xl">
                  {stat.value}
                </b>
                <span className="mt-1 block text-sm text-slate-400">{stat.label}</span>
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
      <section className="mx-auto max-w-6xl px-4 pb-20 sm:px-6 lg:px-8">
        <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-[#0c1330] via-[#131b3f] to-[#2b1030] px-6 py-16 text-center shadow-2xl sm:py-20">
          <div className="pointer-events-none absolute -top-24 left-1/2 h-56 w-[36rem] -translate-x-1/2 rounded-full bg-blue-400/25 blur-3xl" />
          <h2 className="relative text-3xl font-extrabold tracking-tight text-white sm:text-4xl">
            开始免费使用 PDFBzy
          </h2>
          <p className="relative mx-auto mt-3 max-w-xl text-sm text-slate-300 sm:text-base">
            无需注册，无需下载，打开浏览器即可处理你的 PDF 文件。
          </p>
          <div className="relative mt-8 flex flex-wrap items-center justify-center gap-4">
            <Link
              href="/merge-pdf"
              className="rounded-xl bg-gradient-to-r from-blue-500 to-rose-500 px-8 py-3.5 text-base font-bold text-white shadow-[0_12px_32px_rgba(99,102,241,0.5)] transition hover:-translate-y-0.5"
            >
              立即开始
              <ArrowRight className="ml-1 inline h-4 w-4" />
            </Link>
            <Link
              href="/tools"
              className="rounded-xl border border-white/20 bg-white/[0.06] px-8 py-3.5 text-base font-semibold text-slate-200 transition hover:bg-white/[0.12]"
            >
              浏览所有工具
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
