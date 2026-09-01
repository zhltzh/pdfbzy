"use client";

import { useState, useCallback } from "react";
import { friendlyError } from "@/lib/utils";
import { ToolLayout } from "@/components/tools/tool-layout";
import { FileUpload } from "@/components/tools/file-upload";
import { ResultDownload } from "@/components/tools/result-download";
import { getToolBySlug, availableTools } from "@/config/tools";
import { imagesToPDF } from "@/lib/pdf-client";

const tool = getToolBySlug("jpg-to-pdf")!;
const relatedTools = availableTools.filter((t) =>
  ["png-to-pdf", "pdf-to-jpg", "image-to-pdf"].includes(t.id)
);

const faqItems = [
  {
    q: "支持哪些图片格式？",
    a: "支持 JPG（JPEG）和 PNG 两种常见图片格式。如果你有 HEIC、BMP 等其他格式，建议先转换为 JPG 或 PNG。",
  },
  {
    q: "多张图片合并时顺序是怎样的？",
    a: "图片按照你上传的顺序排列，先上传的在前，后上传的在后。上传后可以移除文件重新调整顺序。每张图片会成为 PDF 中的一页。",
  },
  {
    q: "图片质量会压缩吗？",
    a: "不会。转换过程中图片保持原始分辨率和质量，不会进行任何压缩或降质处理。输出的 PDF 文件大小基本等于所有图片大小之和。",
  },
  {
    q: "支持多少张图片？",
    a: "单次最多支持上传 20 张图片。如果你需要转换更多图片，可以分批进行，然后将生成的多个 PDF 用「合并 PDF」工具合并。",
  },
  {
    q: "图片方向不对怎么办？",
    a: "如果图片方向不正确，建议先在图片查看软件中旋转到正确方向，然后再上传转换。你也可以使用 PDF 编辑工具在转换后调整页面方向。",
  },
  {
    q: "转换后的 PDF 文件太大怎么办？",
    a: "如果图片文件较大，生成的 PDF 也会较大。建议在上传前压缩图片尺寸，或使用我们的「压缩 PDF」工具来减小文件体积。",
  },
];

export default function JPGToPDFPage() {
  const [files, setFiles] = useState<File[]>([]);
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

  const handleClear = useCallback(() => {
    setFiles([]);
    setResults(null);
    setProgress("");
    setError(null);
  }, []);

  const handleConvert = useCallback(async () => {
    if (files.length === 0) {
      setError("请先选择要转换的图片。");
      return;
    }

    setIsProcessing(true);
    setError(null);

    try {
      setProgress("正在读取图片...");
      const imageBuffers = await Promise.all(
        files.map(async (f) => {
          const ext = f.name.split(".").pop()?.toLowerCase() || "";
          if (!["jpg", "jpeg", "png"].includes(ext)) {
            throw new Error(`"${f.name}" 不是支持的图片格式（仅支持 JPG 和 PNG）。`);
          }
          const type = (ext === "png" ? "png" : "jpg") as "jpg" | "png";
          return { buffer: await f.arrayBuffer(), type };
        })
      );

      setProgress(`正在将 ${files.length} 张图片转换为 PDF...`);
      const pdfBytes = await imagesToPDF(imageBuffers);

      const blob = new Blob([pdfBytes], { type: "application/pdf" });
      if (blob.size === 0) {
        throw new Error("生成的 PDF 为空，请重试。");
      }

      const resultName =
        files.length === 1
          ? files[0].name.replace(/\.(jpg|jpeg|png)$/i, ".pdf")
          : "merged-images.pdf";

      setResults([{ name: resultName, blob, size: blob.size }]);
      setProgress("");
    } catch (err: any) {
      console.error("Convert failed:", err);
      setError(friendlyError(err, "转换失败，请确保文件是有效的图片格式且未被损坏。"));
    } finally {
      setIsProcessing(false);
      setProgress("");
    }
  }, [files]);

  // 图片预览
  const [previews, setPreviews] = useState<string[]>([]);
  const handleFilesWithPreview = useCallback(
    (newFiles: File[]) => {
      handleFilesSelected(newFiles);
      // 生成预览 URL 并追加，保留已存在预览
      const urls = newFiles.map((f) => URL.createObjectURL(f));
      setPreviews((prev) => [...prev, ...urls]);
    },
    [handleFilesSelected]
  );

  const handleRemoveFileWithPreview = useCallback(
    (index: number) => {
      setFiles((prev) => prev.filter((_, i) => i !== index));
      setPreviews((prev) => {
        const url = prev[index];
        if (url) URL.revokeObjectURL(url);
        return prev.filter((_, i) => i !== index);
      });
    },
    []
  );

  return (
    <ToolLayout tool={tool} faqItems={faqItems} relatedTools={relatedTools}>
      {!results ? (
        <div className="space-y-6">
          {/* 功能提示 */}
          <div className="rounded-xl bg-blue-50 border border-blue-100 p-4 text-sm text-blue-700">
            <p className="font-medium">💡 使用提示</p>
            <p className="mt-1 text-blue-600">
              支持 JPG 和 PNG 格式的图片，每张图片会转换为 PDF 中的一页。
              你可以上传多张图片合并为一个 PDF 文件。
            </p>
          </div>

          <FileUpload
            onFilesSelected={handleFilesWithPreview}
            multiple={true}
            accept=".jpg,.jpeg,.png"
            acceptDescription="JPG、PNG"
            maxFiles={20}
            maxSizeMB={30}
            files={files}
            onRemoveFile={handleRemoveFileWithPreview}
            onClear={() => {
              handleClear();
              previews.forEach((u) => URL.revokeObjectURL(u));
              setPreviews([]);
            }}
          />

          {/* 图片预览 */}
          {previews.length > 0 && (
            <div className="rounded-2xl border bg-white p-4">
              <p className="mb-3 text-sm font-medium text-gray-700">
                图片预览（{previews.length} 张）
              </p>
              <div className="flex gap-3 overflow-x-auto pb-2">
                {previews.map((url, i) => (
                  <div
                    key={i}
                    className="flex-shrink-0 w-20 h-20 rounded-lg overflow-hidden border bg-gray-50"
                  >
                    <img
                      src={url}
                      alt={`图片 ${i + 1}`}
                      className="w-full h-full object-cover"
                    />
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* 错误 */}
          {error && (
            <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3">
              <p className="text-sm text-red-600">{error}</p>
            </div>
          )}

          {/* 处理按钮 */}
          {files.length > 0 && (
            <div className="animate-slide-up">
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
                  `将 ${files.length} 张图片转换为 PDF`
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
