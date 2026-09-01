"use client";

import { useState, useCallback, useMemo } from "react";
import { ToolLayout } from "@/components/tools/tool-layout";
import { ResultDownload } from "@/components/tools/result-download";
import { getToolBySlug } from "@/config/tools";
import { createBlankPDF } from "@/lib/pdf-client";
import { Ruler, RefreshCw } from "lucide-react";
import { cn, friendlyError } from "@/lib/utils";

const tool = getToolBySlug("create-blank-pdf")!;

const PAPER_SIZES = [
  { id: "a4", name: "A4", width: 595.28, height: 841.89, label: "210 × 297 mm" },
  { id: "a3", name: "A3", width: 841.89, height: 1190.55, label: "297 × 420 mm" },
  { id: "a5", name: "A5", width: 419.53, height: 595.28, label: "148 × 210 mm" },
  { id: "letter", name: "Letter", width: 612, height: 792, label: "8.5 × 11 in" },
  { id: "legal", name: "Legal", width: 612, height: 1008, label: "8.5 × 14 in" },
] as const;

export default function CreateBlankPdfPage() {
  const [paperSize, setPaperSize] = useState<string>("a4");
  const [orientation, setOrientation] = useState<"portrait" | "landscape">(
    "portrait"
  );
  const [pageCount, setPageCount] = useState(1);
  const [isProcessing, setIsProcessing] = useState(false);
  const [results, setResults] = useState<
    { name: string; blob: Blob; size: number }[] | null
  >(null);
  const [error, setError] = useState<string | null>(null);
  const [progress, setProgress] = useState("");

  const currentSize = useMemo(
    () => PAPER_SIZES.find((s) => s.id === paperSize) || PAPER_SIZES[0],
    [paperSize]
  );

  // 生效页数：与生成逻辑一致（clamp 到 1-100）
  const effectivePageCount = useMemo(
    () => Math.min(100, Math.max(1, Math.floor(pageCount) || 1)),
    [pageCount]
  );

  // 根据方向计算最终宽高
  const finalSize = useMemo(() => {
    const { width, height } = currentSize;
    return orientation === "portrait"
      ? { width, height }
      : { width: height, height: width };
  }, [currentSize, orientation]);

  const handleGenerate = useCallback(async () => {
    const count = effectivePageCount;
    setIsProcessing(true);
    setError(null);

    try {
      setProgress("正在生成空白 PDF...");
      const resultBytes = await createBlankPDF({
        pageCount: count,
        width: finalSize.width,
        height: finalSize.height,
      });

      const blob = new Blob([resultBytes], { type: "application/pdf" });
      if (blob.size === 0) {
        throw new Error("生成的文件为空，请重试。");
      }

      setResults([
        {
          name: `空白PDF-${count}页-${currentSize.name}${orientation === "landscape" ? "-横向" : ""}.pdf`,
          blob,
          size: blob.size,
        },
      ]);
      setProgress("");
    } catch (err: any) {
      console.error("Create blank PDF failed:", err);
      setError(friendlyError(err, "生成失败，请重试。"));
    } finally {
      setIsProcessing(false);
      setProgress("");
    }
  }, [effectivePageCount, finalSize, currentSize, orientation]);

  return (
    <ToolLayout tool={tool}>
      {!results ? (
        <div className="space-y-6">
          {/* 纸张尺寸 */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              纸张尺寸
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
              {PAPER_SIZES.map((size) => (
                <button
                  key={size.id}
                  type="button"
                  onClick={() => setPaperSize(size.id)}
                  className={cn(
                    "rounded-xl border p-3 text-center transition-all",
                    paperSize === size.id
                      ? "border-primary bg-primary/5 ring-2 ring-primary/20"
                      : "border-gray-200 hover:border-gray-300 bg-white"
                  )}
                >
                  <p
                    className={cn(
                      "font-semibold text-sm",
                      paperSize === size.id ? "text-primary" : "text-gray-700"
                    )}
                  >
                    {size.name}
                  </p>
                  <p className="mt-0.5 text-xs text-gray-400">{size.label}</p>
                </button>
              ))}
            </div>
          </div>

          {/* 方向 */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              页面方向
            </label>
            <div className="flex gap-2">
              {(
                [
                  { id: "portrait", name: "纵向", desc: "高 > 宽" },
                  { id: "landscape", name: "横向", desc: "宽 > 高" },
                ] as const
              ).map((opt) => (
                <button
                  key={opt.id}
                  type="button"
                  onClick={() => setOrientation(opt.id)}
                  className={cn(
                    "flex-1 rounded-xl border p-3 text-center transition-all",
                    orientation === opt.id
                      ? "border-primary bg-primary/5 ring-2 ring-primary/20"
                      : "border-gray-200 hover:border-gray-300 bg-white"
                  )}
                >
                  <p
                    className={cn(
                      "font-semibold text-sm",
                      orientation === opt.id ? "text-primary" : "text-gray-700"
                    )}
                  >
                    {opt.name}
                  </p>
                  <p className="mt-0.5 text-xs text-gray-400">{opt.desc}</p>
                </button>
              ))}
            </div>
          </div>

          {/* 页数 */}
          <div>
            <label
              htmlFor="page-count"
              className="block text-sm font-medium text-gray-700 mb-2"
            >
              页数（1-100）
            </label>
            <input
              id="page-count"
              type="number"
              min={1}
              max={100}
              value={pageCount}
              onChange={(e) => setPageCount(parseInt(e.target.value) || 1)}
              className="w-full sm:w-48 rounded-xl border border-gray-300 px-4 py-2.5 text-center text-lg font-semibold focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none"
            />
          </div>

          {/* 尺寸预览 */}
          <div className="rounded-xl bg-gray-50 p-4 flex items-center gap-4">
            <div
              className="flex-shrink-0 rounded border-2 border-primary/40 bg-white shadow-sm"
              style={{
                width:
                  orientation === "portrait" ? 40 : Math.round(40 * 1.414),
                height:
                  orientation === "portrait" ? Math.round(40 * 1.414) : 40,
              }}
            />
            <div className="text-sm text-gray-600">
              <p className="flex items-center gap-1.5 font-medium text-gray-800">
                <Ruler className="h-4 w-4 text-primary" />
                {currentSize.name} · {orientation === "portrait" ? "纵向" : "横向"}
              </p>
              <p className="mt-1 text-xs text-gray-400">
                {Math.round(finalSize.width)} × {Math.round(finalSize.height)}{" "}
                pt（{Math.round(finalSize.width / 2.8346)} ×{" "}
                {Math.round(finalSize.height / 2.8346)} mm）· 共 {effectivePageCount} 页
              </p>
            </div>
          </div>

          {error && (
            <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3">
              <p className="text-sm text-red-600">{error}</p>
            </div>
          )}

          <button
            onClick={handleGenerate}
            disabled={isProcessing}
            className="w-full rounded-xl bg-gradient-to-r from-blue-500 to-blue-600 px-6 py-3.5 text-base font-semibold text-white shadow-sm hover:from-blue-600 hover:to-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all active:scale-[0.99]"
          >
            {isProcessing ? (
              <span className="flex items-center justify-center gap-2">
                <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                {progress || "生成中..."}
              </span>
            ) : (
              <span className="flex items-center justify-center gap-2">
                <RefreshCw className="h-4 w-4" />
                创建空白 PDF
              </span>
            )}
          </button>
        </div>
      ) : (
        <ResultDownload results={results} onReset={() => setResults(null)} />
      )}
    </ToolLayout>
  );
}
