import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "使用条款",
  description:
    "PDFBzy 使用条款：免费在线 PDF 工具服务的使用规则、免责声明与用户责任说明。",
  alternates: { canonical: "https://pdfbzy.com/terms" },
};

export default function TermsPage() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-16 sm:px-6 lg:px-8">
      <h1 className="text-3xl font-bold text-gray-900">使用条款</h1>
      <p className="mt-2 text-sm text-gray-500">更新日期：2026 年 8 月</p>
      <div className="mt-8 space-y-6 text-gray-600 leading-relaxed">
        <section>
          <h2 className="text-xl font-semibold text-gray-900">1. 服务说明</h2>
          <p className="mt-2">
            PDFBzy 提供免费的在线 PDF 处理工具，所有工具在用户浏览器本地运行。
            我们尽力保证服务的可用性和正确性，但不保证绝对无差错。
          </p>
        </section>
        <section>
          <h2 className="text-xl font-semibold text-gray-900">2. 服务免费原则</h2>
          <p className="mt-2">
            PDFBzy 的核心工具保持永久免费。我们保留未来推出增值服务的权利，但任何付费功能都会明确标注。
          </p>
        </section>
        <section>
          <h2 className="text-xl font-semibold text-gray-900">3. 用户责任</h2>
          <p className="mt-2">
            用户仅可处理自己拥有合法权利的文件。用户应对使用本服务处理文件的行为及其后果负全部责任，
            包括确保不侵犯他人版权、隐私和其他合法权益。
          </p>
        </section>
        <section>
          <h2 className="text-xl font-semibold text-gray-900">4. 免责声明</h2>
          <p className="mt-2">
            由于文件处理在本地区完成，PDFBzy 不存储任何用户文件，也不对因文件处理结果（包括但不限于处理错误、
            数据损坏）产生的损失承担责任。重要文件请务必保留原件并自行验证处理结果。
          </p>
        </section>
        <section>
          <h2 className="text-xl font-semibold text-gray-900">5. 知识产权</h2>
          <p className="mt-2">
            本网站的设计、代码、文案等知识产权归 PDFBzy 所有，未经许可不得复制或用于商业用途。
          </p>
        </section>
        <section>
          <h2 className="text-xl font-semibold text-gray-900">6. 条款变更</h2>
          <p className="mt-2">
            我们保留修改本条款的权利。变更后的条款自发布时生效，继续使用本网站即视为接受新条款。
          </p>
        </section>
      </div>
    </div>
  );
}