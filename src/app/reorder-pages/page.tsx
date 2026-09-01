"use client";

import { useState, useCallback, useRef } from "react";
import { ToolLayout } from "@/components/tools/tool-layout";
import { FileUpload } from "@/components/tools/file-upload";
import { ResultDownload } from "@/components/tools/result-download";
import { getToolBySlug } from "@/config/tools";
import { reorderPDFPages, getPDFPageCount } from "@/lib/pdf-client";
import {
  ListOrdered,
  ArrowUp,
  ArrowDown,
  ChevronsUp,
  ChevronsDown,
  RotateCcw,
} from "lucide-react";
import { cn, friendlyError } from "@/lib/utils";

const tool = getToolBySlug("reorder-pages")!;

export default function ReorderPagesPage() {
  const [files, setFiles] = useState<File[]>([]);
  const [totalPages, setTotalPages] = useState(0);
  // 当前新顺序（存放原始页码，1-indexed）
  const [order, setOrder] = useState<number[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [results, setResults] = useState<
    { name: string; blob: Blob; size: number }[] | null
  >(null);
  const [progress, setProgress] = useState("");
  const [error, setError] = useState<string | null>(null);
  // 拖拽相关
  const [dragIndex, setDragIndex] = useState<number | null>(null);
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null);
  // 分析请求序号：防止旧文件的分析结果后到覆盖新状态
  const analysisTokenRef = useRef(0);

  const handleDragStart = useCallback(
    (e: React.DragEvent, index: number) => {
      setDragIndex(index);
      e.dataTransfer.effectAllowed = "move";
      e.dataTransfer.setData("text/plain", String(index));
    },
    []
  );

  const handleDragOver = useCallback(
    (e: React.DragEvent, index: number) => {
      e.preventDefault();
      e.dataTransfer.dropEffect = "move";
      if (dragOverIndex !== index) setDragOverIndex(index);
    },
    [dragOverIndex]
  );

  const handleDrop = useCallback(
    (e: React.DragEvent, targetIndex: number) => {
      e.preventDefault();
      const fromIndex = dragIndex;
      setDragIndex(null);
      setDragOverIndex(null);
      if (fromIndex === null || fromIndex === targetIndex) return;
      setOrder((prev) => {
        const next = [...prev];
        const [item] = next.splice(fromIndex, 1);
        next.splice(targetIndex, 0, item);
        return next;
      });
    },
    [dragIndex]
  );

  const handleDragEnd = useCallback(() => {
    setDragIndex(null);
    setDragOverIndex(null);
  }, []);

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
          setOrder(Array.from({ length: count }, (_, i) => i + 1));
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
    setOrder([]);
  }, []);

  const handleClear = useCallback(() => {
    analysisTokenRef.current++;
    setFiles([]);
    setTotalPages(0);
    setOrder([]);
    setResults(null);
    setProgress("");
    setError(null);
  }, []);

  const moveItem = useCallback((index: number, delta: number) => {
    setOrder((prev) => {
      const target = index + delta;
      if (target < 0 || target >= prev.length) return prev;
      const next = [...prev];
      const [item] = next.splice(index, 1);
      next.splice(target, 0, item);
      return next;
    });
  }, []);

  const moveToTop = useCallback((index: number) => {
    setOrder((prev) => {
      if (index === 0) return prev;
      const next = [...prev];
      const [item] = next.splice(index, 1);
      next.unshift(item);
      return next;
    });
  }, []);

  const moveToBottom = useCallback((index: number) => {
    setOrder((prev) => {
      if (index === prev.length - 1) return prev;
      const next = [...prev];
      const [item] = next.splice(index, 1);
      next.push(item);
      return next;
    });
  }, []);

  const handleReset = useCallback(() => {
    setOrder(Array.from({ length: totalPages }, (_, i) => i + 1));
  }, [totalPages]);

  const isOrderChanged =
    order.length > 0 &&
    !order.every((pageNum, idx) => pageNum === idx + 1);

  const handleApply = useCallback(async () => {
    if (files.length === 0) {
      setError("请先选择一个 PDF 文件。");
      return;
    }
    if (!isOrderChanged) {
      setError("页面顺序未改变，请先调整顺序。");
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

      setProgress("正在重排页面...");
      const buffer = await file.arrayBuffer();
      const resultBytes = await reorderPDFPages(buffer, order);

      const blob = new Blob([resultBytes], { type: "application/pdf" });
      if (blob.size === 0) {
        throw new Error("处理后的文件为空，请重试。");
      }

      const baseName = file.name.replace(/\.pdf$/i, "");
      setResults([
        {
          name: `${baseName}-已重排.pdf`,
          blob,
          size: blob.size,
        },
      ]);
      setProgress("");
    } catch (err: any) {
      console.error("Reorder pages failed:", err);
      setError(friendlyError(err, "重排失败，请确保文件是有效的 PDF 格式。"));
    } finally {
      setIsProcessing(false);
      setProgress("");
    }
  }, [files, order, isOrderChanged]);

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

          {files.length > 0 && totalPages > 0 && (
            <div className="animate-slide-up space-y-4">
              <div className="rounded-2xl border bg-white p-5">
                <div className="mb-3 flex items-center justify-between">
                  <label className="text-sm font-medium text-gray-700 flex items-center gap-1.5">
                    <ListOrdered className="h-4 w-4 text-primary" />
                    调整页面顺序
                  </label>
                  {isOrderChanged && (
                    <button
                      type="button"
                      onClick={handleReset}
                      className="text-xs px-2.5 py-1 rounded-md bg-gray-100 text-gray-600 hover:bg-gray-200 transition-colors"
                    >
                      <RotateCcw className="inline h-3 w-3 mr-1" />
                      恢复原顺序
                    </button>
                  )}
                </div>

                {/* 顺序列表 */}
                <ol className="space-y-1.5 max-h-96 overflow-y-auto pr-1">
                  {order.map((pageNum, index) => (
                    <li
                      key={pageNum}
                      draggable={!isProcessing}
                      onDragStart={(e) => handleDragStart(e, index)}
                      onDragOver={(e) => handleDragOver(e, index)}
                      onDrop={(e) => handleDrop(e, index)}
                      onDragEnd={handleDragEnd}
                      className={cn(
                        "flex items-center gap-2 rounded-lg border px-3 py-2 transition-all",
                        dragIndex === index
                          ? "opacity-40 border-primary bg-primary/5"
                          : dragOverIndex === index && dragIndex !== null && dragOverIndex !== dragIndex
                          ? "border-primary bg-primary/10"
                          : "border-gray-100 bg-gray-50/50",
                        dragIndex !== null && dragIndex !== index && "cursor-grabbing"
                      )}
                    >
                      <span className="flex-shrink-0 w-6 text-center text-xs font-semibold text-gray-400">
                        {index + 1}
                      </span>
                      <span
                        className={cn(
                          "flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-lg text-sm font-bold",
                          pageNum === index + 1
                            ? "bg-gray-200 text-gray-600"
                            : "bg-primary text-white"
                        )}
                      >
                        {pageNum}
                      </span>
                      <span className="flex-1 text-sm text-gray-500 cursor-grab select-none">
                        {pageNum === index + 1
                          ? `第 ${pageNum} 页（原位）`
                          : `原第 ${pageNum} 页 → 第 ${index + 1} 位`}
                      </span>
                      <div className="flex items-center gap-1">
                        <button
                          type="button"
                          onClick={() => moveToTop(index)}
                          disabled={index === 0}
                          className="rounded-md p-1.5 text-gray-400 hover:text-primary hover:bg-primary/10 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                          aria-label={`将第 ${pageNum} 页移到最前`}
                        >
                          <ChevronsUp className="h-4 w-4" />
                        </button>
                        <button
                          type="button"
                          onClick={() => moveItem(index, -1)}
                          disabled={index === 0}
                          className="rounded-md p-1.5 text-gray-400 hover:text-primary hover:bg-primary/10 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                          aria-label={`将第 ${pageNum} 页上移`}
                        >
                          <ArrowUp className="h-4 w-4" />
                        </button>
                        <button
                          type="button"
                          onClick={() => moveItem(index, 1)}
                          disabled={index === order.length - 1}
                          className="rounded-md p-1.5 text-gray-400 hover:text-primary hover:bg-primary/10 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                          aria-label={`将第 ${pageNum} 页下移`}
                        >
                          <ArrowDown className="h-4 w-4" />
                        </button>
                        <button
                          type="button"
                          onClick={() => moveToBottom(index)}
                          disabled={index === order.length - 1}
                          className="rounded-md p-1.5 text-gray-400 hover:text-primary hover:bg-primary/10 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                          aria-label={`将第 ${pageNum} 页移到最后`}
                        >
                          <ChevronsDown className="h-4 w-4" />
                        </button>
                      </div>
                    </li>
                  ))}
                </ol>

                <p className="mt-3 text-xs text-gray-400">
                  共 {totalPages} 页。可按住行拖拽调整顺序，也可使用右侧按钮精确移动。蓝色页码表示位置发生变化的页面。
                </p>
              </div>

              <button
                onClick={handleApply}
                disabled={isProcessing || !isOrderChanged}
                className="w-full rounded-xl bg-gradient-to-r from-violet-500 to-violet-600 px-6 py-3.5 text-base font-semibold text-white shadow-sm hover:from-violet-600 hover:to-violet-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all active:scale-[0.99]"
              >
                {isProcessing ? (
                  <span className="flex items-center justify-center gap-2">
                    <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                    {progress || "处理中..."}
                  </span>
                ) : (
                  <span className="flex items-center justify-center gap-2">
                    <ListOrdered className="h-4 w-4" />
                    应用新顺序
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
