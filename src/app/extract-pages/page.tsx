"use client";

import { useState, useCallback, useRef } from "react";
import { friendlyError } from "@/lib/utils";
import { ToolLayout } from "@/components/tools/tool-layout";
import { FileUpload } from "@/components/tools/file-upload";
import { PageSelector } from "@/components/tools/page-selector";
import { ResultDownload } from "@/components/tools/result-download";
import { getToolBySlug } from "@/config/tools";
import { extractPDFPages, getPDFPageCount } from "@/lib/pdf-client";
import { FileOutput } from "lucide-react";

const tool = getToolBySlug("extract-pages")!;

export default function ExtractPagesPage() {
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

  const handleRemoveFile = useCallback(
    (index: number) => {
      analysisTokenRef.current++;
      setFiles((prev) => prev.filter((_, i) => i !== index));
      if (files.length <= 1) {
        setTotalPages(0);
        setSelectedPages(new Set());
      }
    },
    [files.length]
  );

  const handleClear = useCallback(() => {
    analysisTokenRef.current++;
    setFiles([]);
    setTotalPages(0);
    setSelectedPages(new Set());
    setResults(null);
    setProgress("");
    setError(null);
  }, []);

  const handleExtract = useCallback(async () => {
    if (files.length === 0) {
      setError("请先选择一个 PDF 文件。");
      return;
    }
    if (selectedPages.size === 0) {
      setError("请选择要提取的页面。");
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

      setProgress("正在提取页面...");
      const buffer = await file.arrayBuffer();
      const pageNumbers = Array.from(selectedPages).sort((a, b) => a - b);
      const resultBytes = await extractPDFPages(buffer, pageNumbers);

      const blob = new Blob([resultBytes], { type: "application/pdf" });
      if (blob.size === 0) {
        throw new Error("处理后的文件为空，请重试。");
      }

      const baseName = file.name.replace(/\.pdf$/i, "");
      setResults([
        {
          name: `${baseName}-提取${pageNumbers.length}页.pdf`,
          blob,
          size: blob.size,
        },
      ]);
      setProgress("");
    } catch (err: any) {
      console.error("Extract pages failed:", err);
      setError(friendlyError(err, "提取失败，请确保文件是有效的 PDF 格式。"));
    } finally {
      setIsProcessing(false);
      setProgress("");
    }
  }, [files, selectedPages]);

  return (
    <ToolLayout tool={tool}>
      {!results ? (
        <div className="space-y-6">
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

          {error && (
            <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3">
              <p className="text-sm text-red-600">{error}</p>
            </div>
          )}

          {files.length > 0 && totalPages > 0 && (
            <div className="animate-slide-up space-y-4">
              <div className="rounded-2xl border bg-white p-5">
                <PageSelector
                  totalPages={totalPages}
                  selectedPages={selectedPages}
                  onSelectionChange={setSelectedPages}
                  label="选择要提取的页面"
                />
              </div>

              <button
                onClick={handleExtract}
                disabled={isProcessing || selectedPages.size === 0}
                className="w-full rounded-xl bg-gradient-to-r from-cyan-500 to-cyan-600 px-6 py-3.5 text-base font-semibold text-white shadow-sm hover:from-cyan-600 hover:to-cyan-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all active:scale-[0.99]"
              >
                {isProcessing ? (
                  <span className="flex items-center justify-center gap-2">
                    <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                    {progress || "处理中..."}
                  </span>
                ) : selectedPages.size === 0 ? (
                  "请选择要提取的页面"
                ) : (
                  <span className="flex items-center justify-center gap-2">
                    <FileOutput className="h-4 w-4" />
                    提取选中的 {selectedPages.size} 页
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
