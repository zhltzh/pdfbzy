import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "联系我们",
  description:
    "联系 PDFBzy 团队：如有建议、问题反馈或合作意向，欢迎随时联系我们。",
  alternates: { canonical: "https://pdf.aixuno.com/contact" },
};

export default function ContactPage() {
  const mailto = "mailto:support@pdfbzy.com";
  return (
    <div className="mx-auto max-w-3xl px-4 py-16 sm:px-6 lg:px-8">
      <h1 className="text-3xl font-bold text-gray-900">联系我们</h1>
      <p className="mt-4 text-gray-600 leading-relaxed">
        有任何问题、功能建议或合作意向？欢迎点击下方邮件地址给我们写信。
      </p>
      <div className="mt-10 grid gap-6 sm:grid-cols-2">
        <div className="rounded-2xl border bg-white p-6 shadow-sm">
          <h2 className="text-lg font-semibold text-gray-900">✉️ 电子邮件</h2>
          <a
            href={mailto}
            className="mt-2 inline-block text-blue-600 hover:underline"
          >
            support@pdfbzy.com
          </a>
          <p className="mt-1 text-sm text-gray-400">用于一般咨询与反馈</p>
        </div>
        <div className="rounded-2xl border bg-white p-6 shadow-sm">
          <h2 className="text-lg font-semibold text-gray-900">💡 功能建议</h2>
          <p className="mt-2 text-gray-600">
            希望新增某个 PDF 工具？告诉我们你的需求，我们会评估并优先开发。
          </p>
          <a
            href={`${mailto}?subject=${encodeURIComponent("功能建议")}`}
            className="mt-3 inline-flex items-center gap-1.5 rounded-lg bg-primary/10 px-4 py-2 text-sm font-medium text-primary hover:bg-primary/20 transition-colors"
          >
            提交功能建议
          </a>
        </div>
      </div>
      <div className="mt-8 rounded-2xl border border-blue-100 bg-blue-50 p-6">
        <h2 className="text-lg font-semibold text-blue-900">隐私保障</h2>
        <p className="mt-2 text-sm text-blue-700">
          请注意：请勿在邮件中发送包含敏感信息的 PDF 文件。
          使用 PDFBzy 工具时，文件仅在你的浏览器本地处理，我们会始终保护你的隐私。
        </p>
      </div>
    </div>
  );
}