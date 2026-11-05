"use client";

import { useState, useEffect, useCallback } from "react";
import { Download, FileText, CheckCircle, RotateCcw, Package, UploadCloud } from "lucide-react";
import { zipSync } from "fflate";
import { formatFileSize, downloadFile, cn } from "@/lib/utils";

interface ResultFile {
  name: string;
  blob: Blob;
  size: number;
}

interface ResultDownloadProps {
  results: ResultFile[];
  onReset: () => void;
  /** 是否启用打包下载（多个文件时用一个 zip） */
  enableBatchDownload?: boolean;
  /** 拖入新文件时直接开始下一轮处理 */
  onDropFiles?: (files: File[]) => void;
  /** 拖拽区接受的扩展名 */
  accept?: string;
}

export function ResultDownload({
  results,
  onReset,
  enableBatchDownload = true,
  onDropFiles,
  accept = ".pdf",
}: ResultDownloadProps) {
  const [downloaded, setDownloaded] = useState<Set<number>>(new Set());
  const [isBatchDownloading, setIsBatchDownloading] = useState(false);
  const [isDragOver, setIsDragOver] = useState(false);

  // results 变化（重新处理/新一批文件）时重置下载状态，避免索引错位
  useEffect(() => {
    setDownloaded(new Set());
    setIsBatchDownloading(false);
  }, [results]);

  const totalSize = results.reduce((sum, f) => sum + f.size, 0);

  const handleDownload = async (index: number) => {
    const file = results[index];
    try {
      downloadFile(file.blob, file.name);
      setDownloaded((prev) => new Set(prev).add(index));
    } catch (err) {
      console.error("Download failed:", err);
      alert("下载失败，请重试。");
    }
  };

  const handleDownloadAll = async () => {
    if (results.length === 1) {
      await handleDownload(0);
      return;
    }

    if (enableBatchDownload) {
      setIsBatchDownloading(true);
      try {
        // 使用 fflate 将多个文件打包为一个 zip 下载
        const files: Record<string, Uint8Array> = {};
        for (const file of results) {
          files[file.name] = new Uint8Array(await file.blob.arrayBuffer());
        }
        const zipped = zipSync(files);
        const zipBlob = new Blob([zipped], { type: "application/zip" });
        const zipName = results[0].name.replace(/\.[^.]+$/, "") + "-打包.zip";
        downloadFile(zipBlob, zipName);
        setDownloaded(new Set(results.map((_, i) => i)));
      } catch (err) {
        console.error("Batch download failed:", err);
        alert("打包下载失败，已改为逐个下载。");
        // 降级方案：逐个下载
        for (let i = 0; i < results.length; i++) {
          downloadFile(results[i].blob, results[i].name);
          setDownloaded((prev) => new Set(prev).add(i));
          await new Promise((r) => setTimeout(r, 300));
        }
      } finally {
        setIsBatchDownloading(false);
      }
    } else {
      for (let i = 0; i < results.length; i++) {
        downloadFile(results[i].blob, results[i].name);
        setDownloaded((prev) => new Set(prev).add(i));
        await new Promise((r) => setTimeout(r, 300));
      }
    }
  };

  const allDownloaded = downloaded.size === results.length;

  const handleDragOver = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      e.stopPropagation();
      if (onDropFiles) setIsDragOver(true);
    },
    [onDropFiles]
  );

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);
  }, []);

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      e.stopPropagation();
      setIsDragOver(false);
      if (!onDropFiles) return;
      const dropped = Array.from(e.dataTransfer.files);
      if (dropped.length > 0) onDropFiles(dropped);
    },
    [onDropFiles]
  );

  return (
    <div className="animate-fade-in">
      {/* 成功标识 + 置顶下载 */}
      <div className="mb-6 flex flex-col gap-4 rounded-2xl bg-gradient-to-r from-green-50 to-emerald-50 border border-green-100 p-5 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-4">
          <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-full bg-green-100">
            <CheckCircle className="h-6 w-6 text-green-600" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-green-800">处理完成！</h3>
            <p className="text-sm text-green-600">
              共生成 {results.length} 个文件，总计 {formatFileSize(totalSize)}
            </p>
          </div>
        </div>
        <button
          onClick={handleDownloadAll}
          disabled={isBatchDownloading || allDownloaded}
          className={cn(
            "inline-flex items-center justify-center gap-2 rounded-xl px-5 py-3 text-sm font-semibold transition-all flex-shrink-0",
            allDownloaded
              ? "bg-white/70 text-gray-400 cursor-default"
              : "bg-primary text-white shadow-sm hover:bg-primary/90 active:scale-[0.98]"
          )}
        >
          {isBatchDownloading ? (
            <>
              <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
              打包中...
            </>
          ) : allDownloaded ? (
            <>
              <CheckCircle className="h-4 w-4" />
              全部已下载
            </>
          ) : results.length > 1 ? (
            <>
              <Package className="h-4 w-4" />
              下载全部 ({results.length})
            </>
          ) : (
            <>
              <Download className="h-4 w-4" />
              下载文件
            </>
          )}
        </button>
      </div>

      {/* 文件列表 */}
      <div className="mb-5 divide-y rounded-xl border bg-white shadow-sm overflow-hidden">
        {results.map((file, index) => (
          <div
            key={index}
            className="flex items-center justify-between px-4 py-3.5 hover:bg-gray-50/50 transition-colors"
          >
            <div className="flex items-center gap-3 min-w-0">
              <FileText className="h-5 w-5 flex-shrink-0 text-primary" />
              <div className="min-w-0">
                <p className="truncate text-sm font-medium text-gray-700 max-w-[300px] sm:max-w-md">
                  {file.name}
                </p>
                <p className="text-xs text-gray-400">
                  {formatFileSize(file.size)}
                </p>
              </div>
            </div>
            <button
              onClick={() => handleDownload(index)}
              disabled={downloaded.has(index)}
              className={cn(
                "flex items-center gap-1.5 rounded-lg px-3.5 py-2 text-sm font-medium transition-all flex-shrink-0",
                downloaded.has(index)
                  ? "bg-green-50 text-green-600 cursor-default"
                  : "bg-primary/10 text-primary hover:bg-primary/20 active:scale-95"
              )}
            >
              <Download className="h-4 w-4" />
              {downloaded.has(index) ? "已下载" : "下载"}
            </button>
          </div>
        ))}
      </div>

      {/* 继续处理：拖拽即开始下一轮 */}
      <div className="mt-5 space-y-3">
        {onDropFiles && (
          <div
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            onClick={onReset}
            className={cn(
              "flex cursor-pointer items-center justify-center gap-3 rounded-2xl border-2 border-dashed px-5 py-6 text-center transition-all",
              isDragOver
                ? "border-primary bg-primary/5 scale-[1.01]"
                : "border-gray-200 bg-white/60 hover:border-primary/50 hover:bg-gray-50/60"
            )}
          >
            <UploadCloud className={cn("h-6 w-6 flex-shrink-0", isDragOver ? "text-primary" : "text-gray-400")} />
            <div className="text-left">
              <p className="text-sm font-medium text-gray-700">
                {isDragOver ? "松开即可开始处理新文件" : "直接拖入新的文件，继续处理"}
              </p>
              <p className="mt-0.5 text-xs text-gray-400">
                也可以点击这里回到上传区 · 支持 {accept.split(",").map((a) => a.trim().replace(".", "").toUpperCase()).join("、")}
              </p>
            </div>
          </div>
        )}
        <button
          onClick={onReset}
          className="w-full inline-flex items-center justify-center gap-1.5 rounded-xl border px-6 py-3 text-sm font-medium text-gray-600 hover:bg-gray-50 hover:text-gray-900 transition-all active:scale-[0.98]"
        >
          <RotateCcw className="h-4 w-4" />
          重新开始
        </button>
      </div>
    </div>
  );
}
