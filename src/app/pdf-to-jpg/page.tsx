"use client";

import { useState, useCallback, useRef, useEffect } from "react";
import { ToolLayout } from "@/components/tools/tool-layout";
import { FileUpload } from "@/components/tools/file-upload";
import { ResultDownload } from "@/components/tools/result-download";
import { getToolBySlug } from "@/config/tools";
import { pdfToImages } from "@/lib/pdf-client";
import { friendlyError } from "@/lib/utils";
import { XCircle } from "lucide-react";

const tool = getToolBySlug("pdf-to-jpg")!;

const MAX_FILES = 10;

export default function PDFToJPGPage() {
  const [files, setFiles] = useState<File[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [results, setResults] = useState<{ name: string; blob: Blob; size: number }[] | null>(null);
  const [progress, setProgress] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [scale, setScale] = useState(1.5);
  const abortRef = useRef<AbortController | null>(null);
  const actionRef = useRef<HTMLDivElement>(null);
  const prevCount = useRef(0);

  const handleFilesSelected = useCallback((newFiles: File[]) => {
    setFiles((prev) => {
      const merged = [...prev, ...newFiles.filter(
        (f) => !prev.some((p) => p.name === f.name && p.size === f.size)
      )];
      return merged.slice(0, MAX_FILES);
    });
    setError(null);
    setResults(null);
  }, []);

  const removeFile = useCallback((index: number) => {
    setFiles((prev) => prev.filter((_, i) => i !== index));
  }, []);

  const handleClear = useCallback(() => {
    abortRef.current?.abort();
    abortRef.current = null;
    setFiles([]);
    setResults(null);
    setProgress("");
    setError(null);
  }, []);

  const handleCancel = useCallback(() => {
    abortRef.current?.abort();
  }, []);

  // 选完文件后把操作区滚进视野，避免按钮落在第二屏
  useEffect(() => {
    if (files.length > prevCount.current && files.length > 0) {
      actionRef.current?.scrollIntoView({ behavior: "smooth", block: "center" });
    }
    prevCount.current = files.length;
  }, [files.length]);

  const runConvert = useCallback(async (targetFiles: File[], append = false) => {
    if (targetFiles.length === 0) {
      setError("请先选择要转换的 PDF 文件。");
      return;
    }

    setIsProcessing(true);
    setError(null);
    abortRef.current = new AbortController();

    try {
      const converted: { name: string; blob: Blob; size: number }[] = [];

      for (let fi = 0; fi < targetFiles.length; fi++) {
        const file = targetFiles[fi];
        const prefix = targetFiles.length > 1 ? `[${fi + 1}/${targetFiles.length}] ` : "";
        setProgress(`${prefix}正在读取 ${file.name}...`);

        const buf = await file.arrayBuffer();
        const { images, totalPages } = await pdfToImages(
          buf,
          "jpeg",
          scale,
          (cur, total) => {
            setProgress(`${prefix}正在渲染第 ${cur}/${total} 页...`);
          },
          abortRef.current.signal
        );

        const baseName = file.name.replace(/\.pdf$/i, "");
        const padLen = String(totalPages).length;
        for (const img of images) {
          converted.push({
            name: `${baseName}-page-${String(img.pageNumber).padStart(padLen, "0")}.jpg`,
            blob: img.blob,
            size: img.blob.size,
          });
        }
      }

      if (converted.length === 0) throw new Error("未能生成任何图片。");
      setResults((prev) => (append && prev ? [...prev, ...converted] : converted));
      setProgress("");
    } catch (err: any) {
      console.error("Convert failed:", err);
      const msg = err?.message || "";
      if (msg.includes("取消")) {
        setProgress("");
      } else {
        setError(friendlyError(err, "转换失败，请确保文件是有效的 PDF 且未被加密。"));
      }
    } finally {
      setIsProcessing(false);
      setProgress("");
      abortRef.current = null;
    }
  }, [scale]);

  const handleConvert = useCallback(() => runConvert(files), [runConvert, files]);

  /** 从结果页拖入新文件：直接开始转换，结果追加到现有列表 */
  const handleDropAndRun = useCallback(
    (dropped: File[]) => {
      if (isProcessing) return;
      const next = dropped.slice(0, MAX_FILES);
      if (next.length === 0) return;
      setFiles(next);
      setError(null);
      void runConvert(next, true);
    },
    [isProcessing, runConvert]
  );

  return (
    <ToolLayout tool={tool}>
      {!results ? (
        <div className="space-y-4">
          <FileUpload
            onFilesSelected={handleFilesSelected}
            multiple
            accept=".pdf"
            acceptDescription="PDF"
            maxFiles={MAX_FILES}
            maxSizeMB={50}
            files={files}
            onRemoveFile={removeFile}
            onClear={handleClear}
          />

          {error && (
            <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3">
              <p className="text-sm text-red-600">{error}</p>
            </div>
          )}

          {files.length > 0 && (
            <div ref={actionRef} className="space-y-3 rounded-2xl border bg-white p-5 animate-slide-up">
              <div>
                <p className="mb-1.5 text-sm font-medium text-gray-700">图片清晰度</p>
                <div className="flex flex-wrap gap-2">
                  {[
                    { v: 1, label: "标准" },
                    { v: 1.5, label: "高清（推荐）" },
                    { v: 2, label: "超清" },
                  ].map((opt) => (
                    <button
                      key={opt.v}
                      onClick={() => setScale(opt.v)}
                      className={`px-3 py-1.5 rounded-lg text-sm border transition-all ${
                        scale === opt.v
                          ? "border-green-500 bg-green-50 text-green-700 font-medium"
                          : "border-gray-200 text-gray-600 hover:border-green-300"
                      }`}
                    >
                      {opt.label}
                      {opt.v > 1 && ` (${opt.v}x)`}
                    </button>
                  ))}
                </div>
                <p className="mt-2 text-xs text-gray-400">
                  清晰度越高图片越大，渲染时间越长。每个 PDF 的每一页会生成一张 JPG。
                </p>
              </div>

              <button
                onClick={handleConvert}
                disabled={isProcessing}
                className="w-full rounded-xl bg-gradient-to-r from-green-500 to-green-600 px-6 py-3.5 text-base font-semibold text-white shadow-sm hover:from-green-600 hover:to-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all active:scale-[0.99]"
              >
                {isProcessing ? (
                  <span className="flex items-center justify-center gap-2">
                    <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                    {progress || "处理中..."}
                  </span>
                ) : (
                  files.length > 1 ? `转换 ${files.length} 个 PDF 为 JPG` : "转换为 JPG 图片"
                )}
              </button>

              {isProcessing && (
                <button
                  onClick={handleCancel}
                  className="w-full inline-flex items-center justify-center gap-1.5 rounded-xl border border-gray-200 px-6 py-3 text-sm font-medium text-gray-600 hover:bg-gray-50 hover:text-red-500 transition-all"
                >
                  <XCircle className="h-4 w-4" />
                  取消转换
                </button>
              )}
            </div>
          )}

          <div className="rounded-xl bg-green-50 border border-green-100 p-4 text-sm text-green-700">
            <p className="font-medium">💡 使用提示</p>
            <p className="mt-1 text-green-600">
              可一次添加最多 {MAX_FILES} 个 PDF，每个 PDF 的每一页转换为一张 JPG，全部在浏览器本地完成，文件不会上传到服务器。
            </p>
          </div>
        </div>
      ) : (
        <ResultDownload
          results={results}
          onReset={handleClear}
          onDropAndRun={handleDropAndRun}
          error={error}
          busy={isProcessing}
          accept=".pdf"
        />
      )}
    </ToolLayout>
  );
}
