"use client";

import { useState, useCallback } from "react";
import { ToolLayout } from "@/components/tools/tool-layout";
import { FileUpload } from "@/components/tools/file-upload";
import { ResultDownload } from "@/components/tools/result-download";
import { getToolBySlug, availableTools } from "@/config/tools";
import { splitPDF, getPDFPageCount } from "@/lib/pdf-client";

const tool = getToolBySlug("split-pdf")!;
const relatedTools = availableTools.filter((t) =>
  ["merge-pdf", "delete-pages", "extract-pages"].includes(t.id)
);

// 超过该页数时提示性能警告（避免浏览器卡死）
const MAX_PAGES_WARNING = 300;

const faqItems = [
  {
    q: "拆分 PDF 后每页生成一个文件吗？",
    a: "是的，拆分后 PDF 的每一页都会生成一个独立的 PDF 文件，方便你单独使用或分发每一页内容。",
  },
  {
    q: "拆分大文件会很慢吗？",
    a: "拆分的速度取决于文件大小和页数。由于处理在浏览器本地完成，大文件可能需要几秒钟时间，但比上传到服务器处理要快得多。",
  },
  {
    q: "拆分后文件质量会下降吗？",
    a: "不会。拆分 PDF 是无损操作，输出的每个 PDF 文件保持了原始页面的所有内容和质量。",
  },
  {
    q: "可以指定拆分某些页面吗？",
    a: "当前版本支持将全部页面逐一拆分。如果你需要提取特定页面，可以使用我们的「提取 PDF 页面」工具。",
  },
  {
    q: "支持拆分加密的 PDF 吗？",
    a: "如果文件没有打开密码（只有编辑权限密码），可以直接拆分。如果有打开密码，请先使用「解密 PDF」工具解除密码保护。",
  },
  {
    q: "页数很多的文件可以拆分吗？",
    a: "可以，但页数超过 300 页时拆分时间会明显变长，且会生成大量文件。建议对超大文档先使用「提取 PDF 页面」或「压缩 PDF」处理后再拆分。",
  },
];

export default function SplitPDFPage() {
  const [files, setFiles] = useState<File[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [results, setResults] = useState<
    { name: string; blob: Blob; size: number }[] | null
  >(null);
  const [progress, setProgress] = useState("");
  const [error, setError] = useState<string | null>(null);

  const handleFilesSelected = useCallback((newFiles: File[]) => {
    setFiles((prev) => [...prev, ...newFiles]);
    setError(null);
    setResults(null);
  }, []);

  const handleRemoveFile = useCallback((index: number) => {
    setFiles((prev) => prev.filter((_, i) => i !== index));
  }, []);

  const handleClear = useCallback(() => {
    setFiles([]);
    setResults(null);
    setProgress("");
    setError(null);
  }, []);

  const handleSplit = useCallback(async () => {
    if (files.length === 0) {
      setError("请先选择一个要拆分的 PDF 文件。");
      return;
    }

    setIsProcessing(true);
    setError(null);

    try {
      const file = files[0];

      // 验证 PDF 文件头
      const header = await file.slice(0, 5).text();
      if (!header.includes("%PDF")) {
        throw new Error(`"${file.name}" 不是有效的 PDF 文件。`);
      }

      setProgress("正在分析 PDF 文件...");
      const buffer = await file.arrayBuffer();

      // 页数预检：超上限时提示性能警告
      const pageCount = await getPDFPageCount(buffer);
      if (pageCount > MAX_PAGES_WARNING) {
        setProgress(`该文件共 ${pageCount} 页，拆分时间较长，请耐心等待...`);
      }

      setProgress("正在拆分 PDF 文件...");
      const { pages } = await splitPDF(buffer, (cur, total) => {
        setProgress(`正在拆分第 ${cur}/${total} 页...`);
      });

      if (pages.length === 0) {
        throw new Error("拆分失败，无法读取 PDF 页面。");
      }

      setProgress("正在生成结果...");
      const baseName = file.name.replace(/\.pdf$/i, "");
      const resultFiles = pages.map((pageBytes, i) => {
        const blob = new Blob([pageBytes], { type: "application/pdf" });
        return {
          name: `${baseName}-第${i + 1}页.pdf`,
          blob,
          size: blob.size,
        };
      });

      setResults(resultFiles);
      setProgress("");
    } catch (err: any) {
      console.error("Split failed:", err);
      setError(
        err.message || "拆分失败，请确保文件是有效的 PDF 格式且未被损坏。"
      );
    } finally {
      setIsProcessing(false);
      setProgress("");
    }
  }, [files]);

  return (
    <ToolLayout tool={tool} faqItems={faqItems} relatedTools={relatedTools}>
      {!results ? (
        <div className="space-y-6">
          {/* 功能提示 */}
          <div className="rounded-xl bg-blue-50 border border-blue-100 p-4 text-sm text-blue-700">
            <p className="font-medium">💡 使用提示</p>
            <p className="mt-1 text-blue-600">
              上传一个 PDF 文件，工具会自动将其每一页拆分为独立的 PDF 文件。
              如果文件页数较多，处理时间可能会稍长，请耐心等待。
            </p>
          </div>

          <FileUpload
            onFilesSelected={handleFilesSelected}
            multiple={false}
            accept=".pdf"
            acceptDescription="PDF"
            maxFiles={1}
            maxSizeMB={50}
            files={files}
            onRemoveFile={handleRemoveFile}
            onClear={handleClear}
          />

          {/* 错误提示 */}
          {error && (
            <div className="flex items-start gap-3 rounded-xl border border-red-200 bg-red-50 px-4 py-3.5">
              <div className="flex-1">
                <p className="text-sm text-red-600">{error}</p>
              </div>
            </div>
          )}

          {/* 处理按钮 */}
          {files.length > 0 && (
            <div className="animate-slide-up">
              <button
                onClick={handleSplit}
                disabled={isProcessing}
                className="w-full rounded-xl bg-gradient-to-r from-purple-600 to-purple-700 px-6 py-3.5 text-base font-semibold text-white shadow-sm hover:from-purple-700 hover:to-purple-800 disabled:opacity-50 disabled:cursor-not-allowed transition-all active:scale-[0.99]"
              >
                {isProcessing ? (
                  <span className="flex items-center justify-center gap-2">
                    <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                    {progress || "处理中..."}
                  </span>
                ) : (
                  "拆分 PDF"
                )}
              </button>
            </div>
          )}
        </div>
      ) : (
        <ResultDownload results={results} onReset={handleClear} />
      )}
    </ToolLayout>
  );
}
