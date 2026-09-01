"use client";

import { useState, useCallback, useRef } from "react";
import { friendlyError } from "@/lib/utils";
import { ToolLayout } from "@/components/tools/tool-layout";
import { FileUpload } from "@/components/tools/file-upload";
import { ResultDownload } from "@/components/tools/result-download";
import { getToolBySlug, availableTools } from "@/config/tools";
import { deletePDFPages, getPDFPageCount } from "@/lib/pdf-client";
import { Trash2, AlertTriangle } from "lucide-react";

const tool = getToolBySlug("delete-pages")!;
const relatedTools = availableTools.filter((t) =>
  ["split-pdf", "extract-pages", "merge-pdf"].includes(t.id)
);

const faqItems = [
  {
    q: "删除页面后可以恢复吗？",
    a: "不可以。删除操作会永久移除选中的页面。建议在操作前先备份原始文件，防止误删重要内容。",
  },
  {
    q: "可以一次性删除多个页面吗？",
    a: "是的，你可以点击多个页码选择要删除的页面，然后一次性全部删除。选中的页面会以红色高亮显示。",
  },
  {
    q: "选择页面后会重新编号吗？",
    a: "会的。删除页面后，剩余的页面会按顺序重新编号。例如删除第 2 页后，原来的第 3 页会变成新的第 2 页。",
  },
  {
    q: "支持删除加密 PDF 的页面吗？",
    a: "如果文件只有编辑权限密码（没有打开密码），pdf-lib 支持处理。如果有打开密码，需要先解密。",
  },
  {
    q: "最多可以处理多少页的文件？",
    a: "没有严格的页数限制，但文件大小不能超过 50MB。对于页数非常多的文件，处理时间可能会稍长。",
  },
];

export default function DeletePagesPage() {
  const [files, setFiles] = useState<File[]>([]);
  const [totalPages, setTotalPages] = useState(0);
  const [selectedPages, setSelectedPages] = useState<Set<number>>(new Set());
  const [isProcessing, setIsProcessing] = useState(false);
  const [results, setResults] = useState<
    { name: string; blob: Blob; size: number }[] | null
  >(null);
  const [progress, setProgress] = useState("");
  const [error, setError] = useState<string | null>(null);
  // 分析请求序号：防止旧文件的分析结果后到覆盖新状态
  const analysisTokenRef = useRef(0);
  // 缓存分析时的文件 buffer，避免处理时二次读取大文件
  const bufferCacheRef = useRef<ArrayBuffer | null>(null);

  const handleFilesSelected = useCallback(
    async (newFiles: File[]) => {
      setFiles((prev) => [...prev, ...newFiles]);
      setError(null);
      setResults(null);
      if (newFiles.length > 0) {
        const token = ++analysisTokenRef.current;
        try {
          const buffer = await newFiles[0].arrayBuffer();
          const count = await getPDFPageCount(buffer);
          if (token !== analysisTokenRef.current) return; // 已被新请求/移除取代
          bufferCacheRef.current = buffer;
          setTotalPages(count);
          setSelectedPages(new Set());
        } catch {
          if (token !== analysisTokenRef.current) return;
          setError("无法读取 PDF 文件，请确认文件格式是否正确。");
        }
      }
    },
    []
  );

  const handleRemoveFile = useCallback((index: number) => {
    analysisTokenRef.current++;
    bufferCacheRef.current = null;
    setFiles((prev) => prev.filter((_, i) => i !== index));
    if (files.length <= 1) {
      setTotalPages(0);
      setSelectedPages(new Set());
    }
  }, [files.length]);

  const handleClear = useCallback(() => {
    analysisTokenRef.current++;
    bufferCacheRef.current = null;
    setFiles([]);
    setTotalPages(0);
    setSelectedPages(new Set());
    setResults(null);
    setProgress("");
    setError(null);
  }, []);

  const togglePage = useCallback((pageNum: number) => {
    setSelectedPages((prev) => {
      const next = new Set(prev);
      if (next.has(pageNum)) {
        next.delete(pageNum);
      } else {
        next.add(pageNum);
      }
      return next;
    });
  }, []);

  const handleDelete = useCallback(async () => {
    if (files.length === 0) {
      setError("请先选择一个 PDF 文件。");
      return;
    }
    if (selectedPages.size === 0) {
      setError("请选择要删除的页面。");
      return;
    }
    if (selectedPages.size >= totalPages) {
      setError("不能删除所有页面！至少需要保留一页。");
      return;
    }

    setIsProcessing(true);
    setError(null);

    try {
      const file = files[0];
      const header = await file.slice(0, 5).text();
      if (!header.includes("%PDF")) {
        throw new Error(`"${file.name}" 不是有效的 PDF 文件。`);
      }

      setProgress("正在删除页面...");
      // 复用分析时缓存的 buffer，避免二次读取大文件
      const buffer = bufferCacheRef.current ?? (await file.arrayBuffer());
      const pageNumbers = Array.from(selectedPages).sort((a, b) => a - b);
      const resultBytes = await deletePDFPages(buffer, pageNumbers);

      const blob = new Blob([resultBytes], { type: "application/pdf" });
      if (blob.size === 0) {
        throw new Error("处理后的文件为空，请重试。");
      }

      const baseName = file.name.replace(/\.pdf$/i, "");
      setResults([
        {
          name: `${baseName}-已删页.pdf`,
          blob,
          size: blob.size,
        },
      ]);
      setProgress("");
    } catch (err: any) {
      console.error("Delete pages failed:", err);
      setError(friendlyError(err, "删除失败，请确保文件是有效的 PDF 格式。"));
    } finally {
      setIsProcessing(false);
      setProgress("");
    }
  }, [files, selectedPages, totalPages]);

  return (
    <ToolLayout tool={tool} faqItems={faqItems} relatedTools={relatedTools}>
      {!results ? (
        <div className="space-y-6">
          {/* 安全提示 */}
          <div className="rounded-xl bg-amber-50 border border-amber-100 p-4 text-sm text-amber-700">
            <div className="flex items-start gap-2">
              <AlertTriangle className="h-5 w-5 flex-shrink-0 mt-0.5" />
              <div>
                <p className="font-medium">删除操作不可撤销</p>
                <p className="mt-1 text-amber-600">
                  删除的页面将永久从 PDF 中移除。建议在操作前备份原始文件。
                </p>
              </div>
            </div>
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

          {/* 错误 */}
          {error && (
            <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3">
              <p className="text-sm text-red-600">{error}</p>
            </div>
          )}

          {/* 页面选择器 */}
          {files.length > 0 && totalPages > 0 && (
            <div className="animate-slide-up space-y-4">
              <div className="rounded-2xl border bg-white p-5">
                <div className="mb-4 flex items-center justify-between">
                  <label className="text-sm font-medium text-gray-700">
                    选择要删除的页面
                  </label>
                  <div className="flex items-center gap-3">
                    <span className="text-xs text-gray-400">
                      共 {totalPages} 页
                    </span>
                    <span className="text-xs font-medium text-red-500">
                      已选 {selectedPages.size} 页
                    </span>
                  </div>
                </div>

                {/* 快捷操作 */}
                <div className="mb-3 flex gap-2">
                  <button
                    onClick={() => {
                      const all = new Set(
                        Array.from({ length: totalPages }, (_, i) => i + 1)
                      );
                      setSelectedPages(all);
                    }}
                    className="text-xs px-2.5 py-1 rounded-md bg-gray-100 text-gray-600 hover:bg-gray-200 transition-colors"
                  >
                    全选
                  </button>
                  <button
                    onClick={() => setSelectedPages(new Set())}
                    className="text-xs px-2.5 py-1 rounded-md bg-gray-100 text-gray-600 hover:bg-gray-200 transition-colors"
                  >
                    取消全部
                  </button>
                </div>

                {/* 页码网格 */}
                <div className="flex flex-wrap gap-2">
                  {Array.from({ length: totalPages }, (_, i) => i + 1).map(
                    (pageNum) => (
                      <button
                        key={pageNum}
                        onClick={() => togglePage(pageNum)}
                        className={`flex h-10 w-10 items-center justify-center rounded-lg text-sm font-medium transition-all active:scale-95 ${
                          selectedPages.has(pageNum)
                            ? "bg-red-500 text-white shadow-sm hover:bg-red-600"
                            : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                        }`}
                      >
                        {pageNum}
                      </button>
                    )
                  )}
                </div>
              </div>

              <button
                onClick={handleDelete}
                disabled={
                  isProcessing || selectedPages.size === 0
                }
                className="w-full rounded-xl bg-gradient-to-r from-red-500 to-red-600 px-6 py-3.5 text-base font-semibold text-white shadow-sm hover:from-red-600 hover:to-red-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all active:scale-[0.99]"
              >
                {isProcessing ? (
                  <span className="flex items-center justify-center gap-2">
                    <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                    {progress || "处理中..."}
                  </span>
                ) : selectedPages.size === 0 ? (
                  "请选择要删除的页面"
                ) : selectedPages.size >= totalPages ? (
                  "不能删除所有页面"
                ) : (
                  <span className="flex items-center justify-center gap-2">
                    <Trash2 className="h-4 w-4" />
                    删除选中的 {selectedPages.size} 页
                  </span>
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
