"use client";

import { useState, useCallback, useRef, useEffect } from "react";
import { friendlyError } from "@/lib/utils";
import { Copy, Check, Download, FileText, Image as ImageIcon, XCircle } from "lucide-react";
import { ToolLayout } from "@/components/tools/tool-layout";
import { FileUpload } from "@/components/tools/file-upload";
import { getToolBySlug } from "@/config/tools";
import { pdfToImages } from "@/lib/pdf-client";

const tool = getToolBySlug("ocr-text")!;

const LANGS = [
  { id: "chi_sim+eng", label: "中文+英文（推荐）", hint: "适合中文为主的文档" },
  { id: "chi_sim", label: "仅中文", hint: "简体中文识别" },
  { id: "eng", label: "仅英文", hint: "英文识别" },
] as const;

export default function OCRTextPage() {
  const [files, setFiles] = useState<File[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [progress, setProgress] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [lang, setLang] = useState<string>("chi_sim+eng");
  const [result, setResult] = useState<{ text: string; pages: number; source: string } | null>(null);
  const [copied, setCopied] = useState(false);
  const workerRef = useRef<any>(null);
  const abortRef = useRef<AbortController | null>(null);

  const handleCancel = useCallback(() => {
    abortRef.current?.abort();
  }, []);

  // 组件卸载时释放 OCR worker
  useEffect(() => {
    return () => {
      if (workerRef.current) {
        try {
          workerRef.current.terminate();
        } catch {
          // ignore
        }
        workerRef.current = null;
      }
    };
  }, []);

  const handleFilesSelected = useCallback((newFiles: File[]) => {
    setFiles(newFiles.slice(0, 1));
    setError(null);
    setResult(null);
  }, []);

  const handleClear = useCallback(() => {
    setFiles([]);
    setError(null);
    setResult(null);
    setCopied(false);
  }, []);

  const handleRemoveFile = useCallback(() => {
    setFiles([]);
    setError(null);
    setResult(null);
    setCopied(false);
  }, []);

  const handleCopy = useCallback(async () => {
    if (!result) return;
    try {
      await navigator.clipboard.writeText(result.text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      alert("复制失败，请手动选择文本复制。");
    }
  }, [result]);

  const handleDownloadText = useCallback(() => {
    if (!result) return;
    const blob = new Blob([result.text], { type: "text/plain;charset=utf-8" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = "ocr-result.txt";
    a.click();
    URL.revokeObjectURL(a.href);
  }, [result]);

  // 下载 OCR 为 PDF（将识别文字排版为多页文本 PDF，不再截断/丢行）
  const handleDownloadPDF = useCallback(async () => {
    if (!result) return;
    try {
      const PDFLib = await import("pdf-lib");
      const pdf = await PDFLib.PDFDocument.create();
      const fontSize = 11;
      const lineHeight = 18;
      const margin = 40;
      const pageWidth = 595; // A4
      const pageHeight = 842;
      const maxWidth = pageWidth - margin * 2;

      // 按换行拆分，超宽行做软换行
      const paragraphs = result.text.split(/\n+/).filter((l) => l.trim());
      const lines: string[] = [];
      for (const p of paragraphs) {
        let remaining = p.trim();
        while (remaining.length > 0) {
          lines.push(remaining.slice(0, 80));
          remaining = remaining.slice(80);
        }
      }
      if (lines.length === 0) lines.push("（未识别到文字）");

      const linesPerPage = Math.floor((pageHeight - margin * 2) / lineHeight);
      let page = pdf.addPage([pageWidth, pageHeight]);
      let y = pageHeight - margin;
      for (let i = 0; i < lines.length; i++) {
        if (i > 0 && i % linesPerPage === 0) {
          page = pdf.addPage([pageWidth, pageHeight]);
          y = pageHeight - margin;
        }
        page.drawText(lines[i], {
          x: margin,
          y,
          size: fontSize,
          maxWidth,
        });
        y -= lineHeight;
      }

      const bytes = await pdf.save();
      const blob = new Blob([bytes as BlobPart], { type: "application/pdf" });
      const a = document.createElement("a");
      a.href = URL.createObjectURL(blob);
      a.download = "ocr-text.pdf";
      a.click();
      setTimeout(() => URL.revokeObjectURL(a.href), 1000);
    } catch (err: any) {
      alert("生成 PDF 失败: " + (err?.message || "未知错误"));
    }
  }, [result]);

  const getTesseract = useCallback(async () => {
    if (workerRef.current) return workerRef.current;
    // @ts-ignore 动态加载
    const Tesseract = (await import("tesseract.js")).default;
    const worker = await Tesseract.createWorker(lang, 1, {
      workerPath: "/vendor/tesseract/worker.min.js",
      corePath: "/vendor/tesseract",
      langPath: "https://tessdata.projectnaptha.com/4.0.0",
      logger: (m: any) => {
        if (m.status === "recognizing text") {
          setProgress(`正在识别文字... ${(m.progress * 100).toFixed(0)}%`);
        } else if (m.status === "loading language traineddata") {
          setProgress("正在下载识别语言包（首次使用可能需要一点时间）...");
        }
      },
    });
    workerRef.current = worker;
    return worker;
  }, [lang]);

  const handleOCR = useCallback(async () => {
    if (files.length === 0) {
      setError("请先上传图片或 PDF 文件。");
      return;
    }

    setIsProcessing(true);
    setError(null);
    setResult(null);
    const abort = new AbortController();
    abortRef.current = abort;

    try {
      const file = files[0];
      const ext = file.name.split(".").pop()?.toLowerCase() || "";
      const isPDF = ext === "pdf";

      let images: { blob: Blob; pageNumber: number }[];
      let pageCount = 1;

      const worker = await getTesseract();

      if (isPDF) {
        setProgress("正在渲染 PDF 页面...");
        const buf = await file.arrayBuffer();
        const res = await pdfToImages(buf, "png", 2, undefined, abort.signal);
        images = res.images;
        pageCount = res.totalPages;
      } else {
        // 图片文件直接作为 Blob
        setProgress("正在读取图片...");
        images = [{ blob: file, pageNumber: 1 }];
      }

      // 逐页 OCR（tesseract.js 原生支持 Blob 输入）
      const texts: string[] = [];
      for (const img of images) {
        if (abort.signal.aborted) throw new Error("操作已取消");
        if (images.length > 1) {
          setProgress(`正在识别第 ${img.pageNumber}/${images.length} 页...`);
        }
        const { data } = await worker.recognize(img.blob);
        texts.push(data.text);
      }

      const fullText = texts.join("\n\n").trim();
      if (!fullText) {
        setError(
          "未识别到文字。可能是扫描件清晰度不足，建议上传更高分辨率的图片，或选择更合适的语言。"
        );
      } else {
        setResult({
          text: fullText,
          pages: pageCount,
          source: file.name,
        });
      }
      setProgress("");
    } catch (err: any) {
      console.error("OCR failed:", err);
      const msg = err?.message || "";
      if (msg.includes("取消")) {
        setProgress("");
      } else {
        setError(friendlyError(err, "识别失败，请检查文件是否有效。"));
      }
    } finally {
      // 无论成功失败都释放 worker，避免异常路径泄漏导致下次用旧语言包/异常状态
      if (workerRef.current) {
        try {
          await workerRef.current.terminate();
        } catch {
          // ignore
        }
        workerRef.current = null;
      }
      setIsProcessing(false);
      setProgress("");
      abortRef.current = null;
    }
  }, [files, getTesseract]);

  return (
    <ToolLayout tool={tool}>
      {!result ? (
        <div className="space-y-6">
          <div className="rounded-xl bg-sky-50 border border-sky-100 p-4 text-sm text-sky-700">
            <p className="font-medium">💡 使用提示</p>
            <p className="mt-1 text-sky-600">
              上传清晰的扫描件或图片（JPG/PNG），或 PDF 文件。识别引擎在浏览器本地运行，
              首次使用需下载语言包（CDN），之后自动缓存。
            </p>
          </div>

          <FileUpload
            onFilesSelected={handleFilesSelected}
            multiple={false}
            accept=".pdf,.jpg,.jpeg,.png,.webp"
            acceptDescription="PDF、JPG、PNG"
            maxFiles={1}
            maxSizeMB={50}
            files={files}
            onRemoveFile={handleRemoveFile}
            onClear={handleClear}
          />

          {files.length > 0 && (
            <div className="rounded-2xl border bg-white p-5 animate-slide-up">
              <p className="mb-3 text-sm font-medium text-gray-700">识别语言</p>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {LANGS.map((l) => (
                  <button
                    key={l.id}
                    onClick={() => setLang(l.id)}
                    className={`text-left rounded-xl border-2 p-4 transition-all ${
                      lang === l.id
                        ? "border-sky-500 bg-sky-50"
                        : "border-gray-200 hover:border-sky-300"
                    }`}
                  >
                    <p className={`font-medium ${lang === l.id ? "text-sky-700" : "text-gray-700"}`}>
                      {l.label}
                    </p>
                    <p className="mt-0.5 text-xs text-gray-400">{l.hint}</p>
                  </button>
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
            <div className="space-y-3">
              <button
                onClick={handleOCR}
                disabled={isProcessing}
                className="w-full rounded-xl bg-gradient-to-r from-sky-500 to-sky-600 px-6 py-3.5 text-base font-semibold text-white shadow-sm hover:from-sky-600 hover:to-sky-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all active:scale-[0.99]"
              >
                {isProcessing ? (
                  <span className="flex items-center justify-center gap-2">
                    <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                    {progress || "处理中..."}
                  </span>
                ) : (
                  "开始识别文字"
                )}
              </button>
              {isProcessing && (
                <button
                  onClick={handleCancel}
                  className="w-full inline-flex items-center justify-center gap-1.5 rounded-xl border border-gray-200 px-6 py-3 text-sm font-medium text-gray-600 hover:bg-gray-50 hover:text-red-500 transition-all"
                >
                  <XCircle className="h-4 w-4" />
                  取消识别
                </button>
              )}
            </div>
          )}
        </div>
      ) : (
        <div className="space-y-6 animate-fade-in">
          {/* 成功标识 */}
          <div className="flex items-center gap-4 rounded-2xl bg-gradient-to-r from-green-50 to-emerald-50 border border-green-100 p-5">
            <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-full bg-green-100">
              <FileText className="h-6 w-6 text-green-600" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-green-800">识别完成！</h3>
              <p className="text-sm text-green-600">
                已从 {result.source} 中提取 {result.pages} 页文字的文本内容
              </p>
            </div>
          </div>

          {/* 结果文本 */}
          <div className="rounded-xl border bg-white shadow-sm overflow-hidden">
            <div className="flex items-center justify-between bg-gray-50 px-4 py-2.5 border-b">
              <span className="text-sm font-medium text-gray-700">
                识别结果（{result.text.length} 字）
              </span>
              <div className="flex items-center gap-2">
                <button
                  onClick={handleCopy}
                  className="inline-flex items-center gap-1 text-xs px-2.5 py-1.5 rounded-lg border border-gray-200 text-gray-600 hover:bg-gray-100 transition-colors"
                >
                  {copied ? (
                    <>
                      <Check className="h-3.5 w-3.5 text-green-500" /> 已复制
                    </>
                  ) : (
                    <>
                      <Copy className="h-3.5 w-3.5" /> 复制
                    </>
                  )}
                </button>
                <button
                  onClick={handleDownloadText}
                  className="inline-flex items-center gap-1 text-xs px-2.5 py-1.5 rounded-lg border border-gray-200 text-gray-600 hover:bg-gray-100 transition-colors"
                >
                  <Download className="h-3.5 w-3.5" /> 下载 TXT
                </button>
              </div>
            </div>
            <textarea
              readOnly
              value={result.text}
              className="w-full h-72 p-4 text-sm text-gray-800 bg-white focus:outline-none resize-y font-mono leading-relaxed"
            />
          </div>

          {/* 底部操作 */}
          <div className="flex flex-col sm:flex-row gap-3">
            <button
              onClick={handleDownloadPDF}
              className="flex-1 inline-flex items-center justify-center gap-2 rounded-xl bg-primary text-white px-6 py-3 text-sm font-semibold shadow-sm hover:bg-primary/90 transition-all"
            >
              <FileText className="h-4 w-4" />
              导出为文本 PDF
            </button>
            <button
              onClick={handleClear}
              className="inline-flex items-center justify-center gap-1.5 rounded-xl border px-6 py-3 text-sm font-medium text-gray-600 hover:bg-gray-50 transition-all"
            >
              识别其他文件
            </button>
          </div>
        </div>
      )}
    </ToolLayout>
  );
}
