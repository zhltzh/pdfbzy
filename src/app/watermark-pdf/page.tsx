"use client";

import { useState, useCallback, useRef } from "react";
import { friendlyError } from "@/lib/utils";
import { ToolLayout } from "@/components/tools/tool-layout";
import { FileUpload } from "@/components/tools/file-upload";
import { ResultDownload } from "@/components/tools/result-download";
import { getToolBySlug } from "@/config/tools";
import { addWatermark } from "@/lib/pdf-client";
import { XCircle } from "lucide-react";

const tool = getToolBySlug("watermark-pdf")!;

const OPACITIES = [
  { v: 0.08, label: "极浅" },
  { v: 0.15, label: "浅（推荐）" },
  { v: 0.3, label: "中等" },
  { v: 0.5, label: "明显" },
];

export default function WatermarkPDFPage() {
  const [files, setFiles] = useState<File[]>([]);
  const [text, setText] = useState("机密");
  const [opacity, setOpacity] = useState(0.15);
  const [angle, setAngle] = useState(45);
  const [fontSize, setFontSize] = useState(60);
  const [layout, setLayout] = useState<"tiled" | "centered">("tiled");
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

  const handleProcess = useCallback(async () => {
    if (files.length === 0) {
      setError("请先上传需要添加水印的 PDF 文件。");
      return;
    }
    if (!text.trim()) {
      setError("请输入水印文字内容。");
      return;
    }

    setIsProcessing(true);
    setError(null);
    abortRef.current = new AbortController();

    try {
      setProgress("正在生成水印并处理文档...");
      const buf = await files[0].arrayBuffer();
      const outBuf = await addWatermark(
        buf,
        {
          text,
          opacity,
          angleDeg: angle,
          fontSize,
          layout,
        },
        (cur, total) => {
          if (total > 1) setProgress(`正在为第 ${cur}/${total} 页添加水印...`);
        },
        abortRef.current.signal
      );
      const blob = new Blob([outBuf], { type: "application/pdf" });
      if (blob.size === 0) throw new Error("生成的文件为空，请重试。");
      setResults([
        {
          name: files[0].name.replace(/\.pdf$/i, "-watermarked.pdf"),
          blob,
          size: blob.size,
        },
      ]);
      setProgress("");
    } catch (err: any) {
      console.error("Watermark failed:", err);
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
  }, [files, text, opacity, angle, fontSize, layout]);

  return (
    <ToolLayout tool={tool}>
      {!results ? (
        <div className="space-y-6">
          <div className="rounded-xl bg-rose-50 border border-rose-100 p-4 text-sm text-rose-700">
            <p className="font-medium">💡 使用提示</p>
            <p className="mt-1 text-rose-600">
              支持中文水印文字，自动应用到每一页。可调整透明度、旋转角度、字号，选择平铺或居中排版。
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
              {/* 水印文字 */}
              <div>
                <label className="mb-1.5 block text-sm font-medium text-gray-700">
                  水印文字
                </label>
                <input
                  type="text"
                  value={text}
                  onChange={(e) => setText(e.target.value)}
                  placeholder="输入水印内容，如：机密、草稿、版权所有"
                  className="w-full rounded-xl border border-gray-200 px-4 py-2.5 text-sm focus:border-rose-400 focus:ring-2 focus:ring-rose-100 outline-none transition-all"
                />
              </div>

              {/* 排版方式 */}
              <div>
                <label className="mb-1.5 block text-sm font-medium text-gray-700">
                  排版方式
                </label>
                <div className="flex gap-2">
                  <button
                    onClick={() => setLayout("tiled")}
                    className={`px-4 py-2 rounded-lg text-sm border transition-all ${
                      layout === "tiled"
                        ? "border-rose-500 bg-rose-50 text-rose-700 font-medium"
                        : "border-gray-200 text-gray-600 hover:border-rose-300"
                    }`}
                  >
                    平铺铺满
                  </button>
                  <button
                    onClick={() => setLayout("centered")}
                    className={`px-4 py-2 rounded-lg text-sm border transition-all ${
                      layout === "centered"
                        ? "border-rose-500 bg-rose-50 text-rose-700 font-medium"
                        : "border-gray-200 text-gray-600 hover:border-rose-300"
                    }`}
                  >
                    居中显示
                  </button>
                </div>
              </div>

              {/* 透明度 */}
              <div>
                <label className="mb-1.5 block text-sm font-medium text-gray-700">
                  透明度
                </label>
                <div className="flex flex-wrap gap-2">
                  {OPACITIES.map((o) => (
                    <button
                      key={o.v}
                      onClick={() => setOpacity(o.v)}
                      className={`px-3 py-1.5 rounded-lg text-sm border transition-all ${
                        opacity === o.v
                          ? "border-rose-500 bg-rose-50 text-rose-700 font-medium"
                          : "border-gray-200 text-gray-600 hover:border-rose-300"
                      }`}
                    >
                      {o.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* 旋转角度 */}
              <div>
                <label className="mb-1.5 block text-sm font-medium text-gray-700">
                  旋转角度：{angle}°
                </label>
                <div className="flex flex-wrap gap-2">
                  {[0, 15, 30, 45, 60, 90].map((a) => (
                    <button
                      key={a}
                      onClick={() => setAngle(a)}
                      className={`px-3 py-1.5 rounded-lg text-sm border transition-all ${
                        angle === a
                          ? "border-rose-500 bg-rose-50 text-rose-700 font-medium"
                          : "border-gray-200 text-gray-600 hover:border-rose-300"
                      }`}
                    >
                      {a}°
                    </button>
                  ))}
                </div>
              </div>

              {/* 字号 */}
              <div>
                <label className="mb-1.5 block text-sm font-medium text-gray-700">
                  字号：{fontSize}px
                </label>
                <input
                  type="range"
                  min={20}
                  max={200}
                  step={10}
                  value={fontSize}
                  onChange={(e) => setFontSize(Number(e.target.value))}
                  className="w-full"
                />
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
                className="w-full rounded-xl bg-gradient-to-r from-rose-500 to-rose-600 px-6 py-3.5 text-base font-semibold text-white shadow-sm hover:from-rose-600 hover:to-rose-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all active:scale-[0.99]"
              >
                {isProcessing ? (
                  <span className="flex items-center justify-center gap-2">
                    <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                    {progress || "处理中..."}
                  </span>
                ) : (
                  "添加水印"
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
