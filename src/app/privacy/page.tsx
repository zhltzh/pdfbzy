import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "隐私政策",
  description:
    "PDFBzy 隐私政策：所有 PDF 处理在浏览器本地完成，文件不上传服务器，我们不会收集、存储或分享你的文档数据。",
  alternates: { canonical: "https://pdfbzy.com/privacy" },
};

export default function PrivacyPage() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-16 sm:px-6 lg:px-8">
      <h1 className="text-3xl font-bold text-gray-900">隐私政策</h1>
      <p className="mt-2 text-sm text-gray-500">更新日期：2026 年 8 月</p>
      <div className="mt-8 space-y-6 text-gray-600 leading-relaxed">
        <section>
          <h2 className="text-xl font-semibold text-gray-900">1. 我们收集什么</h2>
          <p className="mt-2">
            PDFBzy 的核心原则是<strong>本地处理</strong>。我们的 PDF 工具全部在您的浏览器中运行，
            您的文件和文档内容<strong>永远不会上传到我们的服务器</strong>，因此我们不会收集您的文档数据。
          </p>
          <p className="mt-2">
            我们本身不设置任何数据采集功能。您在上传文件、使用工具的过程中，不涉及注册、登录、
            表单填写等个人信息的收集。
          </p>
        </section>
        <section>
          <h2 className="text-xl font-semibold text-gray-900">2. 文件数据如何处理</h2>
          <p className="mt-2">
            您在 PDFBzy 上传的文件仅在你的浏览器内存中处理。关闭或刷新页面后，
            文件数据立即销毁，不留存、不复制、不备份。
          </p>
        </section>
        <section>
          <h2 className="text-xl font-semibold text-gray-900">3. 网站日志与部署平台</h2>
          <p className="mt-2">
            本站为纯静态网站，托管平台或网络服务商可能会按其默认配置保留基础的服务器访问日志
            （如 IP 地址、请求时间、访问页面）以保障服务安全与稳定。我们本身不采集、不使用这些日志，
            也不会将其用于任何形式的文档内容分析。
          </p>
        </section>
        <section>
          <h2 className="text-xl font-semibold text-gray-900">4. 第三方服务</h2>
          <p className="mt-2">
            部分工具在首次使用时需从第三方 CDN 加载识别语言包等公共资源，这些请求仅包含通用资源地址，
            不包含您的文件或文档内容。我们未接入任何访客统计或广告追踪服务。
          </p>
        </section>
        <section>
          <h2 className="text-xl font-semibold text-gray-900">5. 政策更新</h2>
          <p className="mt-2">
            我们可能不时更新本隐私政策。重大变更会在此页面公告，请定期查看。
            继续使用本网站即表示您同意更新后的政策。
          </p>
        </section>
        <section>
          <h2 className="text-xl font-semibold text-gray-900">6. 联系方式</h2>
          <p className="mt-2">
            如有隐私相关问题，请通过我们的联系页面与我们沟通。
          </p>
        </section>
      </div>
    </div>
  );
}