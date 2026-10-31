import type { Metadata } from "next";
import Link from "next/link";
import { BUILT_TOOL_COUNT } from "@/config/built-tools";

export const metadata: Metadata = {
  title: "关于我们",
  description:
    `PDFBzy 是一个免费在线 PDF 工具平台，提供合并、拆分、转换、编辑、签名等 ${BUILT_TOOL_COUNT}+ 种 PDF 处理工具。所有工具在浏览器本地运行，无需注册，保护用户隐私。`,
  alternates: { canonical: "https://pdf.aixuno.com/about" },
};

export default function AboutPage() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-16 sm:px-6 lg:px-8">
      <h1 className="text-3xl font-bold text-gray-900">关于 PDFBzy</h1>
      <div className="mt-8 space-y-6 text-gray-600 leading-relaxed">
        <p>
          <strong>PDFBzy</strong> 是一个专注于 PDF 处理的在线工具平台。我们的使命是让 PDF
          处理变得简单、免费、安全，让每个人都能在浏览器中轻松完成各种 PDF 操作，无需安装任何软件。
        </p>
        <h2 className="text-xl font-semibold text-gray-900">我们的理念</h2>
        <ul className="list-disc pl-6 space-y-2">
          <li><strong>完全免费</strong>：所有工具永久免费使用，无水印、无次数限制。</li>
          <li><strong>隐私优先</strong>：所有处理在浏览器本地完成，文件绝不离开你的设备。</li>
          <li><strong>无需注册</strong>：打开网页即可使用，流程简洁高效。</li>
          <li><strong>持续更新</strong>：不断新增工具，满足用户多样化的 PDF 处理需求。</li>
        </ul>
        <h2 className="text-xl font-semibold text-gray-900">技术架构</h2>
        <p>
          PDFBzy 使用先进的浏览器端 PDF 引擎（pdf-lib、PDF.js、Ghostscript WASM、Tesseract OCR），
          在客户端本地完成全部处理逻辑，包括合并拆分、压缩、转换、加密解密、文字识别等。
          这意味着你的文档隐私得到最大程度保护，同时处理速度快、无需等待上传下载。
        </p>
        <h2 className="text-xl font-semibold text-gray-900">联系我们</h2>
        <p>
          如有任何问题、建议或合作意向，欢迎通过{" "}
          <Link href="/contact" className="text-primary hover:underline">
            联系我们页面
          </Link>{" "}
          与我们取得联系。
        </p>
      </div>
    </div>
  );
}