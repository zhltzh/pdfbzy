"use client";

import { useState, useCallback, useRef, useEffect } from "react";
import { friendlyError } from "@/lib/utils";
import { ToolLayout } from "@/components/tools/tool-layout";
import { FileUpload } from "@/components/tools/file-upload";
import { ResultDownload } from "@/components/tools/result-download";
import { getToolBySlug } from "@/config/tools";
import { compressPDF } from "@/lib/pdf-client";
import { XCircle } from "lucide-react";

const tool = getToolBySlug("compress-pdf")!;

const MAX_FILES = 10;

const PRESETS = [
  {
    id: "screen",
    label: "最大压缩",
    desc: "适合网页、邮件附件，体积最小",
    detail: "约可压缩 70-85%",
  },
  {
    id: "ebook",
    label: "推荐压缩",
    desc: "适合平板、手机阅读，均衡之选",
    detail: "约可压缩 45-55%",
  },
  {
    id: "printer",
    label: "打印质量",
    desc: "适合桌面打印，质量较高",
    detail: "约可压缩 25-35%",
  },
  {
    id: "prepress",
    label: "印刷品质",
    desc: "适合专业印刷，质量优先",
    detail: "约可压缩 10-20%",
  },
] as const;

export default function CompressPDFPage() {
  const [files, setFiles] = useState<File[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [results, setResults] = useState<{ name: string; blob: Blob; size: number }[] | null>(null);
  const [progress, setProgress] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [preset, setPreset] = useState<string>("ebook");
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

  useEffect(() => {
    if (files.length > prevCount.current && files.length > 0) {
      actionRef.current?.scrollIntoView({ behavior: "smooth", block: "center" });
    }
    prevCount.current = files.length;
  }, [files.length]);

  const runCompress = useCallback(async (targetFiles: File[], append = false) => {
    if (targetFiles.length === 0) {
      setError("请先选择要压缩的 PDF 文件。");
      return;
    }

    setIsProcessing(true);
    setError(null);
    abortRef.current = new AbortController();

    try {
      setProgress("正在加载压缩引擎（首次使用需下载约 15MB 引擎，请稍候）...");

      const out: { name: string; blob: Blob; size: number }[] = [];
      const failed: string[] = [];

      for (let fi = 0; fi < targetFiles.length; fi++) {
        const file = targetFiles[fi];
        const prefix = targetFiles.length > 1 ? `[${fi + 1}/${targetFiles.length}] ` : "";
        setProgress(`${prefix}正在压缩 ${file.name}...`);

        try {
          const buf = await file.arrayBuffer();
          const outBuf = await compressPDF(buf, preset as any, abortRef.current.signal);
          const blob = new Blob([outBuf], { type: "application/pdf" });
          if (blob.size === 0) throw new Error("空文件");
          out.push({
            name: file.name.replace(/\.pdf$/i, "-compressed.pdf"),
            blob,
            size: blob.size,
          });
        } catch (inner: any) {
          if ((inner?.message || "").includes("取消")) throw inner;
          failed.push(file.name);
        }
      }

      if (out.length === 0) {
        throw new Error("所有文件都压缩失败，请更换压缩档位重试。");
      }
      setResults((prev) => (append && prev ? [...prev, ...out] : out));
      if (failed.length > 0) {
        setError(`${failed.length} 个文件压缩失败：${failed.join("、")}。其余已成功。`);
      }
      setProgress("");
    } catch (err: any) {
      console.error("Compress failed:", err);
      const msg = err?.message || "";
      if (msg.includes("取消")) {
        setProgress("");
      } else {
        setError(friendlyError(err, "压缩失败，请确保文件是有效的 PDF。"));
      }
    } finally {
      setIsProcessing(false);
      setProgress("");
      abortRef.current = null;
    }
  }, [preset]);

  const handleCompress = useCallback(() => runCompress(files), [runCompress, files]);

  /** 从结果页拖入新文件：沿用当前压缩档位直接开始处理，结果追加到现有列表 */
  const handleDropAndRun = useCallback(
    (dropped: File[]) => {
      if (isProcessing) return;
      const next = dropped.slice(0, MAX_FILES);
      if (next.length === 0) return;
      setFiles(next);
      setError(null);
      void runCompress(next, true);
    },
    [isProcessing, runCompress]
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
            maxSizeMB={200}
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
                <p className="mb-3 text-sm font-medium text-gray-700">压缩强度</p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {PRESETS.map((p) => (
                    <button
                      key={p.id}
                      onClick={() => setPreset(p.id)}
                      className={`text-left rounded-xl border-2 p-4 transition-all ${
                        preset === p.id
                          ? "border-teal-500 bg-teal-50"
                          : "border-gray-200 hover:border-teal-300"
                      }`}
                    >
                      <p className={`font-medium ${preset === p.id ? "text-teal-700" : "text-gray-700"}`}>
                        {p.label}
                      </p>
                      <p className="mt-0.5 text-xs text-gray-400">{p.desc}</p>
                      <p className={`mt-1 text-xs font-medium ${preset === p.id ? "text-teal-600" : "text-teal-500/70"}`}>
                        {p.detail}
                      </p>
                    </button>
                  ))}
                </div>
              </div>

              <button
                onClick={handleCompress}
                disabled={isProcessing}
                className="w-full rounded-xl bg-gradient-to-r from-teal-500 to-teal-600 px-6 py-3.5 text-base font-semibold text-white shadow-sm hover:from-teal-600 hover:to-teal-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all active:scale-[0.99]"
              >
                {isProcessing ? (
                  <span className="flex items-center justify-center gap-2">
                    <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                    {progress || "处理中..."}
                  </span>
                ) : (
                  files.length > 1 ? `压缩 ${files.length} 个 PDF` : "压缩 PDF"
                )}
              </button>

              {isProcessing && (
                <button
                  onClick={handleCancel}
                  className="w-full inline-flex items-center justify-center gap-1.5 rounded-xl border border-gray-200 px-6 py-3 text-sm font-medium text-gray-600 hover:bg-gray-50 hover:text-red-500 transition-all"
                >
                  <XCircle className="h-4 w-4" />
                  取消压缩
                </button>
              )}
            </div>
          )}

          <div className="rounded-xl bg-teal-50 border border-teal-100 p-4 text-sm text-teal-700">
            <p className="font-medium">💡 使用提示</p>
            <p className="mt-1 text-teal-600">
              可一次添加最多 {MAX_FILES} 个 PDF，统一使用同一压缩档位。基于 Ghostscript 专业压缩引擎，在浏览器本地完成，文件不会上传到服务器。首次使用需加载压缩引擎（约 15MB），之后浏览器会缓存。
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
          dropHint="沿用当前压缩档位"
        />
      )}
    </ToolLayout>
  );
}
