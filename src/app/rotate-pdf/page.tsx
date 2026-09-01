"use client";

import { useState, useCallback } from "react";
import { friendlyError } from "@/lib/utils";
import { ToolLayout } from "@/components/tools/tool-layout";
import { FileUpload } from "@/components/tools/file-upload";
import { ResultDownload } from "@/components/tools/result-download";
import { getToolBySlug, availableTools } from "@/config/tools";
import { rotatePDF } from "@/lib/pdf-client";
import { RotateCw } from "lucide-react";

const tool = getToolBySlug("rotate-pdf")!;
const relatedTools = availableTools.filter((t) =>
  ["crop-pdf", "delete-pages", "merge-pdf"].includes(t.id)
);

const faqItems = [
  {
    q: "旋转 PDF 会改变文件质量吗？",
    a: "不会。旋转 PDF 是无损操作，不会影响文件中的文字、图片或其他内容的质量。",
  },
  {
    q: "可以只旋转 PDF 中的某一页吗？",
    a: "当前版本会旋转文件中的所有页面。如果你需要只处理特定页面，可以先使用「拆分 PDF」工具拆分后再旋转。",
  },
  {
    q: "支持哪些旋转角度？",
    a: "支持 90° 顺时针、180° 旋转和 90° 逆时针（270°）三种旋转方式，覆盖了日常使用中的所有需求。",
  },
  {
    q: "旋转后文字会倒过来吗？",
    a: "会的。页面旋转后，上面的所有内容（文字、图片等）都会随之旋转。如果旋转 180°，文字会颠倒。",
  },
  {
    q: "旋转后可以撤销吗？",
    a: "如果你下载了文件后想恢复原始状态，需要重新上传原文件进行操作。建议保留原始文件备份。",
  },
];

export default function RotatePDFPage() {
  const [files, setFiles] = useState<File[]>([]);
  const [rotation, setRotation] = useState(90);
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

  const handleRotate = useCallback(async () => {
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

      setProgress(`正在旋转 PDF (${rotation}°)...`);
      const buffer = await file.arrayBuffer();
      const rotatedBytes = await rotatePDF(buffer, rotation);

      const blob = new Blob([rotatedBytes], { type: "application/pdf" });
      if (blob.size === 0) {
        throw new Error("处理后的文件为空，请重试。");
      }

      const baseName = file.name.replace(/\.pdf$/i, "");
      const angleLabel =
        rotation === 90
          ? "顺时针90度"
          : rotation === 180
          ? "旋转180度"
          : "逆时针90度";

      setResults([
        { name: `${baseName}-${angleLabel}.pdf`, blob, size: blob.size },
      ]);
      setProgress("");
    } catch (err: any) {
      console.error("Rotate failed:", err);
      setError(friendlyError(err, "旋转失败，请确保文件是有效的 PDF 格式。"));
    } finally {
      setIsProcessing(false);
      setProgress("");
    }
  }, [files, rotation]);

  return (
    <ToolLayout tool={tool} faqItems={faqItems} relatedTools={relatedTools}>
      {!results ? (
        <div className="space-y-6">
          {/* 功能提示 */}
          <div className="rounded-xl bg-blue-50 border border-blue-100 p-4 text-sm text-blue-700">
            <p className="font-medium">💡 使用提示</p>
            <p className="mt-1 text-blue-600">
              上传 PDF 文件后，选择需要旋转的角度，点击"旋转 PDF"按钮即可。
              所有页面将会统一旋转。
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

          {files.length > 0 && (
            <div className="animate-slide-up space-y-4">
              {/* 角度选择 */}
              <div className="rounded-2xl border bg-white p-5">
                <label className="mb-4 block text-sm font-medium text-gray-700">
                  选择旋转角度
                </label>
                <div className="grid grid-cols-3 gap-3">
                  {[
                    { value: 90, label: "90° 顺时针" },
                    { value: 180, label: "180°" },
                    { value: 270, label: "90° 逆时针" },
                  ].map((r) => (
                    <button
                      key={r.value}
                      onClick={() => setRotation(r.value)}
                      className={`flex flex-col items-center gap-2.5 rounded-xl border-2 p-5 transition-all ${
                        rotation === r.value
                          ? "border-primary bg-primary/5 text-primary shadow-sm"
                          : "border-gray-100 hover:border-gray-200 text-gray-500 hover:bg-gray-50"
                      }`}
                    >
                      <RotateCw
                        className="h-7 w-7"
                        style={{
                          transform: `rotate(${r.value}deg)`,
                        }}
                      />
                      <span className="text-sm font-medium">{r.label}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* 错误 */}
              {error && (
                <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3">
                  <p className="text-sm text-red-600">{error}</p>
                </div>
              )}

              <button
                onClick={handleRotate}
                disabled={isProcessing}
                className="w-full rounded-xl bg-gradient-to-r from-green-600 to-green-700 px-6 py-3.5 text-base font-semibold text-white shadow-sm hover:from-green-700 hover:to-green-800 disabled:opacity-50 disabled:cursor-not-allowed transition-all active:scale-[0.99]"
              >
                {isProcessing ? (
                  <span className="flex items-center justify-center gap-2">
                    <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                    {progress || "处理中..."}
                  </span>
                ) : (
                  "旋转 PDF"
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
