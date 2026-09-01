"use client";

import { useState, useCallback } from "react";
import { ToolLayout } from "@/components/tools/tool-layout";
import { FileUpload } from "@/components/tools/file-upload";
import { ResultDownload } from "@/components/tools/result-download";
import { getToolBySlug, availableTools } from "@/config/tools";
import { mergePDFs } from "@/lib/pdf-client";

const tool = getToolBySlug("merge-pdf")!;
const relatedTools = availableTools.filter((t) =>
  ["split-pdf", "jpg-to-pdf", "delete-pages"].includes(t.id)
);

const faqItems = [
  {
    q: "合并 PDF 支持多少个文件？",
    a: "单次最多支持合并 10 个 PDF 文件。如果你需要合并更多文件，可以分批进行合并操作。",
  },
  {
    q: "合并 PDF 时文件会泄露吗？",
    a: "完全不会。所有文件处理都在你的浏览器本地完成，文件不会被上传到任何服务器。处理完成后，你的文件只存在于你的设备上。",
  },
  {
    q: "合并后 PDF 质量会下降吗？",
    a: "不会下降。PDFBzy 使用专业的 pdf-lib 引擎处理文件，合并过程是无损的，输出文件的质量和原始文件完全一致。",
  },
  {
    q: "合并后的文件顺序是怎样的？",
    a: "文件按照你上传的顺序合并。先上传的文件会在前面，后上传的在后。如果需要调整顺序，请先清除全部文件后重新按顺序上传。",
  },
  {
    q: "支持合并加密的 PDF 文件吗？",
    a: "不支持。带有打开密码的加密 PDF 无法直接合并，请先使用「解密 PDF」工具移除密码保护后再合并。",
  },
];

export default function MergePDFPage() {
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

  const handleMerge = useCallback(async () => {
    if (files.length < 2) {
      setError("请至少选择 2 个 PDF 文件进行合并。");
      return;
    }

    setIsProcessing(true);
    setError(null);
    setProgress("正在读取文件...");

    try {
      // 验证每个文件是否为有效 PDF
      for (const file of files) {
        const header = await file.slice(0, 5).text();
        if (!header.includes("%PDF")) {
          throw new Error(`"${file.name}" 不是有效的 PDF 文件。`);
        }
      }

      setProgress("正在合并 PDF 文件...");
      // 串行读取，避免一次性把所有大文件读入内存（10×50MB 峰值）
      const buffers: ArrayBuffer[] = [];
      for (let i = 0; i < files.length; i++) {
        setProgress(`正在读取文件 ${i + 1}/${files.length}...`);
        buffers.push(await files[i].arrayBuffer());
      }
      setProgress("正在合并 PDF 文件...");
      const mergedBytes = await mergePDFs(buffers);

      const blob = new Blob([mergedBytes], { type: "application/pdf" });

      // 验证结果
      if (blob.size === 0) {
        throw new Error("合并后的文件为空，请重试。");
      }

      setResults([
        {
          name: "merged-output.pdf",
          blob,
          size: blob.size,
        },
      ]);
      setProgress("");
    } catch (err: any) {
      console.error("Merge failed:", err);
      setError(
        err.message || "合并失败，请确保所有文件都是有效的 PDF 格式。"
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
              将多个 PDF 文件拖拽到下方区域，或点击选择文件，然后点击"合并"按钮即可。
              合并后文件按上传顺序排列。最少需要 2 个文件。
            </p>
          </div>

          <FileUpload
            onFilesSelected={handleFilesSelected}
            multiple={true}
            accept=".pdf"
            acceptDescription="PDF"
            maxFiles={10}
            maxSizeMB={50}
            files={files}
            onRemoveFile={handleRemoveFile}
            onClear={handleClear}
          />

          {/* 自定义错误 */}
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
              {files.length < 2 ? (
                <div className="rounded-xl bg-amber-50 border border-amber-100 px-5 py-4 text-sm text-amber-700">
                  请至少上传 <strong>2 个</strong> PDF 文件才能合并
                  （当前 {files.length} 个）
                </div>
              ) : (
                <button
                  onClick={handleMerge}
                  disabled={isProcessing}
                  className="w-full rounded-xl bg-gradient-to-r from-blue-600 to-blue-700 px-6 py-3.5 text-base font-semibold text-white shadow-sm hover:from-blue-700 hover:to-blue-800 disabled:opacity-50 disabled:cursor-not-allowed transition-all active:scale-[0.99]"
                >
                  {isProcessing ? (
                    <span className="flex items-center justify-center gap-2">
                      <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                      {progress || "处理中..."}
                    </span>
                  ) : (
                    `合并 ${files.length} 个 PDF 文件`
                  )}
                </button>
              )}
            </div>
          )}
        </div>
      ) : (
        <ResultDownload results={results} onReset={handleClear} />
      )}
    </ToolLayout>
  );
}
