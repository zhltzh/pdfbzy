"use client";

import { useState, useCallback } from "react";
import { friendlyError } from "@/lib/utils";
import { ToolLayout } from "@/components/tools/tool-layout";
import { FileUpload } from "@/components/tools/file-upload";
import { ResultDownload } from "@/components/tools/result-download";
import { getToolBySlug } from "@/config/tools";
import { imagesToPDF } from "@/lib/pdf-client";

const tool = getToolBySlug("png-to-pdf")!;

export default function PNGToPDFPage() {
  const [files, setFiles] = useState<File[]>([]);
  const [previews, setPreviews] = useState<string[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [results, setResults] = useState<{ name: string; blob: Blob; size: number }[] | null>(null);
  const [progress, setProgress] = useState("");
  const [error, setError] = useState<string | null>(null);

  const handleFilesSelected = useCallback((newFiles: File[]) => {
    setFiles((prev) => [...prev, ...newFiles]);
    setError(null);
    setResults(null);
  }, []);

  const handleRemoveFile = useCallback((index: number) => {
    setFiles((prev) => prev.filter((_, i) => i !== index));
    setPreviews((prev) => {
      const url = prev[index];
      if (url) URL.revokeObjectURL(url);
      return prev.filter((_, i) => i !== index);
    });
  }, []);

  const handleClear = useCallback(() => {
    setFiles([]);
    setResults(null);
    setProgress("");
    setError(null);
  }, []);

  const handleConvert = useCallback(async () => {
    if (files.length === 0) {
      setError("请先选择要转换的 PNG 图片。");
      return;
    }

    setIsProcessing(true);
    setError(null);

    try {
      setProgress("正在读取图片...");
      const imageBuffers = await Promise.all(
        files.map(async (f) => {
          const ext = f.name.split(".").pop()?.toLowerCase() || "";
          if (ext !== "png") {
            throw new Error(`"${f.name}" 不是 PNG 图片。如果包含其他格式，请使用「图片转 PDF」工具。`);
          }
          return { buffer: await f.arrayBuffer(), type: "png" as const };
        })
      );

      setProgress(`正在将 ${files.length} 张图片转换为 PDF...`);
      const pdfBytes = await imagesToPDF(imageBuffers);

      const blob = new Blob([pdfBytes], { type: "application/pdf" });
      if (blob.size === 0) {
        throw new Error("生成的 PDF 为空，请重试。");
      }

      const resultName =
        files.length === 1 ? files[0].name.replace(/\.png$/i, ".pdf") : "merged-png.pdf";

      setResults([{ name: resultName, blob, size: blob.size }]);
      setProgress("");
    } catch (err: any) {
      console.error("Convert failed:", err);
      setError(friendlyError(err, "转换失败，请确保文件是有效的 PNG 图片且未被损坏。"));
    } finally {
      setIsProcessing(false);
      setProgress("");
    }
  }, [files]);

  const handleFilesWithPreview = useCallback(
    (newFiles: File[]) => {
      handleFilesSelected(newFiles);
      const urls = newFiles.map((f) => URL.createObjectURL(f));
      setPreviews((prev) => [...prev, ...urls]);
    },
    [handleFilesSelected]
  );

  return (
    <ToolLayout tool={tool}>
      {!results ? (
        <div className="space-y-6">
          <div className="rounded-xl bg-amber-50 border border-amber-100 p-4 text-sm text-amber-700">
            <p className="font-medium">💡 使用提示</p>
            <p className="mt-1 text-amber-600">
              支持 PNG 图片转换为 PDF，每张图片一页，可多张合并为一个文件。浏览器本地处理，不上传服务器。
            </p>
          </div>

          <FileUpload
            onFilesSelected={handleFilesWithPreview}
            multiple={true}
            accept=".png"
            acceptDescription="PNG"
            maxFiles={20}
            maxSizeMB={30}
            files={files}
            onRemoveFile={handleRemoveFile}
            onClear={() => {
              handleClear();
              previews.forEach((u) => URL.revokeObjectURL(u));
              setPreviews([]);
            }}
          />

          {previews.length > 0 && (
            <div className="rounded-2xl border bg-white p-4">
              <p className="mb-3 text-sm font-medium text-gray-700">
                PNG 预览（{previews.length} 张）
              </p>
              <div className="flex gap-3 overflow-x-auto pb-2">
                {previews.map((url, i) => (
                  <div
                    key={i}
                    className="flex-shrink-0 w-20 h-20 rounded-lg overflow-hidden border bg-gray-50"
                  >
                    <img
                      src={url}
                      alt={`PNG ${i + 1}`}
                      className="w-full h-full object-cover"
                    />
                  </div>
                ))}
              </div>
            </div>
          )}

          {error && (
            <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3">
              <p className="text-sm text-red-600">{error}</p>
            </div>
          )}

          {files.length > 0 && (
            <button
              onClick={handleConvert}
              disabled={isProcessing}
              className="w-full rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 px-6 py-3.5 text-base font-semibold text-white shadow-sm hover:from-amber-600 hover:to-amber-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all active:scale-[0.99]"
            >
              {isProcessing ? (
                <span className="flex items-center justify-center gap-2">
                  <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                  {progress || "处理中..."}
                </span>
              ) : (
                `将 ${files.length} 张 PNG 图片转换为 PDF`
              )}
            </button>
          )}
        </div>
      ) : (
        <ResultDownload results={results} onReset={handleClear} />
      )}
    </ToolLayout>
  );
}
