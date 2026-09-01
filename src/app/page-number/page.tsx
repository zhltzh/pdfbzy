"use client";

import { useState, useCallback, useRef } from "react";
import { friendlyError } from "@/lib/utils";
import { ToolLayout } from "@/components/tools/tool-layout";
import { FileUpload } from "@/components/tools/file-upload";
import { ResultDownload } from "@/components/tools/result-download";
import { getToolBySlug } from "@/config/tools";
import { addPageNumbers } from "@/lib/pdf-client";
import { XCircle } from "lucide-react";

const tool = getToolBySlug("page-number")!;

const POSITIONS = [
  { id: "bottom-center", label: "底部居中" },
  { id: "bottom-right", label: "底部靠右" },
  { id: "bottom-left", label: "底部靠左" },
  { id: "top-center", label: "顶部居中" },
  { id: "top-right", label: "顶部靠右" },
  { id: "top-left", label: "顶部靠左" },
] as const;

const FORMATS = [
  { id: "number", label: "纯数字（1、2、3）" },
  { id: "page-x", label: "第 X 页" },
  { id: "page-x-of-y", label: "第 X 页 / 共 Y 页" },
] as const;

export default function PageNumberPage() {
  const [files, setFiles] = useState<File[]>([]);
  const [position, setPosition] = useState<string>("bottom-center");
  const [format, setFormat] = useState<string>("number");
  const [startNumber, setStartNumber] = useState(1);
  const [fontSize, setFontSize] = useState(12);
  const [isProcessing, setIsProcessing] = useState(false);
  const [progress, setProgress] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [results, setResults] = useState<{ name: string; blob: Blob; size: number }[] | null>(null);
  const abortRef = useRef<AbortController | null>(null);

  const handleFilesSelected = useCallback((newFiles: File[]) => {
    setFiles(newFiles.slice(0, 1));
    setError(null);
    setResults(null);
  }, []);

  const handleCancel = useCallback(() => {
    abortRef.current?.abort();
  }, []);

  const handleClear = useCallback(() => {
    abortRef.current?.abort();
    abortRef.current = null;
    setFiles([]);
    setResults(null);
    setProgress("");
    setError(null);
  }, []);

  const handleProcess = useCallback(async () => {
    if (files.length === 0) {
      setError("请先上传需要添加页码的 PDF 文件。");
      return;
    }

    setIsProcessing(true);
    setError(null);
    abortRef.current = new AbortController();

    try {
      setProgress("正在为每一页添加页码...");
      const buf = await files[0].arrayBuffer();
      const outBuf = await addPageNumbers(
        buf,
        {
          position: position as any,
          format: format as any,
          startNumber,
          fontSize,
        },
        (cur, total) => {
          if (total > 1) setProgress(`正在为第 ${cur}/${total} 页添加页码...`);
        },
        abortRef.current.signal
      );
      const blob = new Blob([outBuf], { type: "application/pdf" });
      if (blob.size === 0) throw new Error("生成的文件为空，请重试。");
      setResults([
        {
          name: files[0].name.replace(/\.pdf$/i, "-numbered.pdf"),
          blob,
          size: blob.size,
        },
      ]);
      setProgress("");
    } catch (err: any) {
      console.error("Page number failed:", err);
      const msg = err?.message || "";
      if (msg.includes("取消")) {
        setProgress("");
      } else {
        setError(friendlyError(err, "处理失败，请检查 PDF 文件是否有效。"));
      }
    } finally {
      setIsProcessing(false);
      setProgress("");
      abortRef.current = null;
    }
  }, [files, position, format, startNumber, fontSize]);

  return (
    <ToolLayout tool={tool}>
      {!results ? (
        <div className="space-y-6">
          <div className="rounded-xl bg-cyan-50 border border-cyan-100 p-4 text-sm text-cyan-700">
            <p className="font-medium">💡 使用提示</p>
            <p className="mt-1 text-cyan-600">
              自动为每一页添加页码。支持页眉页脚六种位置、三种页码格式，可自定义起始页码和字号。
            </p>
          </div>

          <FileUpload
            onFilesSelected={handleFilesSelected}
            multiple={false}
            accept=".pdf"
            acceptDescription="PDF"
            maxFiles={1}
            maxSizeMB={200}
            files={files}
            onRemoveFile={handleClear}
            onClear={handleClear}
          />

          {files.length > 0 && (
            <div className="rounded-2xl border bg-white p-5 space-y-5 animate-slide-up">
              {/* 页码位置 */}
              <div>
                <label className="mb-1.5 block text-sm font-medium text-gray-700">
                  页码位置
                </label>
                <div className="flex flex-wrap gap-2">
                  {POSITIONS.map((p) => (
                    <button
                      key={p.id}
                      onClick={() => setPosition(p.id)}
                      className={`px-3 py-1.5 rounded-lg text-sm border transition-all ${
                        position === p.id
                          ? "border-cyan-600 bg-cyan-50 text-cyan-700 font-medium"
                          : "border-gray-200 text-gray-600 hover:border-cyan-300"
                      }`}
                    >
                      {p.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* 页码格式 */}
              <div>
                <label className="mb-1.5 block text-sm font-medium text-gray-700">
                  页码格式
                </label>
                <div className="flex flex-wrap gap-2">
                  {FORMATS.map((f) => (
                    <button
                      key={f.id}
                      onClick={() => setFormat(f.id)}
                      className={`px-3 py-1.5 rounded-lg text-sm border transition-all ${
                        format === f.id
                          ? "border-cyan-600 bg-cyan-50 text-cyan-700 font-medium"
                          : "border-gray-200 text-gray-600 hover:border-cyan-300"
                      }`}
                    >
                      {f.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* 起始页码 + 字号 */}
              <div className="grid sm:grid-cols-2 gap-4">
                <div>
                  <label className="mb-1.5 block text-sm font-medium text-gray-700">
                    起始页码
                  </label>
                  <input
                    type="number"
                    min={0}
                    value={startNumber}
                    onChange={(e) => setStartNumber(Math.max(0, Number(e.target.value) || 1))}
                    className="w-full rounded-xl border border-gray-200 px-4 py-2.5 text-sm focus:border-cyan-400 focus:ring-2 focus:ring-cyan-100 outline-none transition-all"
                  />
                </div>
                <div>
                  <label className="mb-1.5 block text-sm font-medium text-gray-700">
                    字号：{fontSize}px
                  </label>
                  <input
                    type="range"
                    min={8}
                    max={40}
                    value={fontSize}
                    onChange={(e) => setFontSize(Number(e.target.value))}
                    className="w-full mt-3"
                  />
                </div>
              </div>
            </div>
          )}

          {error && (
            <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3">
              <p className="text-sm text-red-600">{error}</p>
            </div>
          )}

          {files.length > 0 && (
            <div className="space-y-3">
              <button
                onClick={handleProcess}
                disabled={isProcessing}
                className="w-full rounded-xl bg-gradient-to-r from-cyan-600 to-cyan-700 px-6 py-3.5 text-base font-semibold text-white shadow-sm hover:from-cyan-700 hover:to-cyan-800 disabled:opacity-50 disabled:cursor-not-allowed transition-all active:scale-[0.99]"
              >
                {isProcessing ? (
                  <span className="flex items-center justify-center gap-2">
                    <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                    {progress || "处理中..."}
                  </span>
                ) : (
                  "添加页码"
                )}
              </button>
              {isProcessing && (
                <button
                  onClick={handleCancel}
                  className="w-full inline-flex items-center justify-center gap-1.5 rounded-xl border border-gray-200 px-6 py-3 text-sm font-medium text-gray-600 hover:bg-gray-50 hover:text-red-500 transition-all"
                >
                  <XCircle className="h-4 w-4" />
                  取消处理
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
