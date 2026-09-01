"use client";

import { useState, useCallback, useMemo, useRef } from "react";
import { ToolLayout } from "@/components/tools/tool-layout";
import { FileUpload } from "@/components/tools/file-upload";
import { ResultDownload } from "@/components/tools/result-download";
import { getToolBySlug } from "@/config/tools";
import { cropPDF, getPDFPageCount } from "@/lib/pdf-client";
import { Crop, Scissors } from "lucide-react";
import { cn, friendlyError } from "@/lib/utils";

const tool = getToolBySlug("crop-pdf")!;

// 毫米转磅 (1 inch = 25.4mm = 72pt)
const mmToPt = (mm: number) => (mm * 72) / 25.4;

type CropMode = "standard" | "custom";

const PRESET_MODES: {
  id: CropMode;
  name: string;
  desc: string;
  margins?: { top: number; bottom: number; left: number; right: number };
}[] = [
  {
    id: "standard",
    name: "标准边距",
    desc: "四周均匀裁剪 2cm 边距",
    margins: { top: 20, bottom: 20, left: 20, right: 20 },
  },
  {
    id: "custom",
    name: "自定义边距",
    desc: "四边独立设置裁剪量（毫米）",
  },
];

export default function CropPdfPage() {
  const [files, setFiles] = useState<File[]>([]);
  const [totalPages, setTotalPages] = useState(0);
  const [mode, setMode] = useState<CropMode>("standard");
  const [margins, setMargins] = useState({
    top: 20,
    bottom: 20,
    left: 20,
    right: 20,
  });
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
    setFiles((prev) => prev.filter((_, i) => i !== index));
    setTotalPages(0);
  }, []);

  const handleClear = useCallback(() => {
    analysisTokenRef.current++;
    setFiles([]);
    setTotalPages(0);
    setResults(null);
    setProgress("");
    setError(null);
  }, []);

  const handleMarginChange = useCallback(
    (key: keyof typeof margins, value: number) => {
      setMargins((prev) => ({
        ...prev,
        [key]: Math.max(0, Math.min(100, value)),
      }));
    },
    []
  );

  const effectiveMargins = useMemo(() => {
    if (mode === "standard") {
      return PRESET_MODES[0].margins!;
    }
    return margins;
  }, [mode, margins]);

  const handleCrop = useCallback(async () => {
    if (files.length === 0) {
      setError("请先选择一个 PDF 文件。");
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

      setProgress("正在裁剪...");
      const buffer = await file.arrayBuffer();
      const resultBytes = await cropPDF(
        buffer,
        {
          top: mmToPt(effectiveMargins.top),
          bottom: mmToPt(effectiveMargins.bottom),
          left: mmToPt(effectiveMargins.left),
          right: mmToPt(effectiveMargins.right),
        }
      );

      const blob = new Blob([resultBytes], { type: "application/pdf" });
      if (blob.size === 0) {
        throw new Error("处理后的文件为空，请重试。");
      }

      const baseName = file.name.replace(/\.pdf$/i, "");
      setResults([
        {
          name: `${baseName}-已裁剪.pdf`,
          blob,
          size: blob.size,
        },
      ]);
      setProgress("");
    } catch (err: any) {
      console.error("Crop PDF failed:", err);
      setError(friendlyError(err, "裁剪失败，请确保文件是有效的 PDF 格式。"));
    } finally {
      setIsProcessing(false);
      setProgress("");
    }
  }, [files, effectiveMargins]);

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

          {files.length > 0 && (
            <div className="animate-slide-up space-y-4">
              <div className="rounded-2xl border bg-white p-5 space-y-5">
                {/* 模式选择 */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    裁剪模式
                  </label>
                  <div className="grid gap-2 sm:grid-cols-3">
                    {PRESET_MODES.map((m) => (
                      <button
                        key={m.id}
                        type="button"
                        onClick={() => setMode(m.id)}
                        className={cn(
                          "rounded-xl border p-3 text-left transition-all",
                          mode === m.id
                            ? "border-primary bg-primary/5 ring-2 ring-primary/20"
                            : "border-gray-200 hover:border-gray-300 bg-white"
                        )}
                      >
                        <p
                          className={cn(
                            "font-medium text-sm",
                            mode === m.id ? "text-primary" : "text-gray-700"
                          )}
                        >
                          {m.name}
                        </p>
                        <p className="mt-0.5 text-xs text-gray-400">{m.desc}</p>
                      </button>
                    ))}
                  </div>
                </div>

                {/* 自定义边距 */}
                {mode === "custom" && (
                  <div className="rounded-xl bg-gray-50 p-4">
                    <p className="text-sm font-medium text-gray-700 mb-3">
                      裁剪边距（毫米）
                    </p>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                      {(
                        [
                          { key: "top", label: "上边距" },
                          { key: "bottom", label: "下边距" },
                          { key: "left", label: "左边距" },
                          { key: "right", label: "右边距" },
                        ] as const
                      ).map((f) => (
                        <div key={f.key}>
                          <label
                            htmlFor={`margin-${f.key}`}
                            className="block text-xs text-gray-500 mb-1"
                          >
                            {f.label}
                          </label>
                          <div className="flex items-center rounded-lg border border-gray-300 bg-white focus-within:border-primary focus-within:ring-2 focus-within:ring-primary/20">
                            <input
                              id={`margin-${f.key}`}
                              type="number"
                              min={0}
                              max={100}
                              value={margins[f.key]}
                              onChange={(e) =>
                                handleMarginChange(f.key, parseInt(e.target.value) || 0)
                              }
                              className="w-full rounded-lg px-3 py-2 text-sm outline-none"
                            />
                            <span className="pr-3 text-xs text-gray-400">mm</span>
                          </div>
                        </div>
                      ))}
                    </div>
                    <p className="mt-2 text-xs text-gray-400">
                      {totalPages > 0
                        ? `将应用于全部 ${totalPages} 页。裁剪值过大可能裁掉页面内容，请谨慎设置。`
                        : "裁剪值过大可能裁掉页面内容，请谨慎设置。"}
                    </p>
                  </div>
                )}

                {/* 当前设置摘要 */}
                <div className="flex flex-wrap items-center gap-3 rounded-lg bg-blue-50 border border-blue-100 px-4 py-3 text-xs text-blue-700">
                  <Scissors className="h-4 w-4" />
                  <span>
                    上 {effectiveMargins.top}mm · 下 {effectiveMargins.bottom}mm · 左{" "}
                    {effectiveMargins.left}mm · 右 {effectiveMargins.right}mm
                  </span>
                  <span className="text-blue-500">
                    （{Math.round(mmToPt(effectiveMargins.top))}pt ×{" "}
                    {Math.round(mmToPt(effectiveMargins.bottom))}pt ×{" "}
                    {Math.round(mmToPt(effectiveMargins.left))}pt ×{" "}
                    {Math.round(mmToPt(effectiveMargins.right))}pt）
                  </span>
                </div>
              </div>

              <button
                onClick={handleCrop}
                disabled={isProcessing}
                className="w-full rounded-xl bg-gradient-to-r from-orange-500 to-orange-600 px-6 py-3.5 text-base font-semibold text-white shadow-sm hover:from-orange-600 hover:to-orange-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all active:scale-[0.99]"
              >
                {isProcessing ? (
                  <span className="flex items-center justify-center gap-2">
                    <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                    {progress || "处理中..."}
                  </span>
                ) : (
                  <span className="flex items-center justify-center gap-2">
                    <Crop className="h-4 w-4" />
                    裁剪 PDF
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
