"use client";

import { useState, useEffect } from "react";
import { Download, FileText, CheckCircle, RotateCcw, Package } from "lucide-react";
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
}

export function ResultDownload({
  results,
  onReset,
  enableBatchDownload = true,
}: ResultDownloadProps) {
  const [downloaded, setDownloaded] = useState<Set<number>>(new Set());
  const [isBatchDownloading, setIsBatchDownloading] = useState(false);

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

  return (
    <div className="animate-fade-in">
      {/* 成功标识 */}
      <div className="mb-6 flex items-center gap-4 rounded-2xl bg-gradient-to-r from-green-50 to-emerald-50 border border-green-100 p-5">
        <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-full bg-green-100">
          <CheckCircle className="h-6 w-6 text-green-600" />
        </div>
        <div>
          <h3 className="text-lg font-semibold text-green-800">
            处理完成！
          </h3>
          <p className="text-sm text-green-600">
            共生成 {results.length} 个文件，总计 {formatFileSize(totalSize)}
          </p>
        </div>
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

      {/* 操作按钮 */}
      <div className="flex flex-col sm:flex-row gap-3">
        <button
          onClick={handleDownloadAll}
          disabled={isBatchDownloading}
          className={cn(
            "flex-1 inline-flex items-center justify-center gap-2 rounded-xl px-6 py-3 text-sm font-semibold transition-all",
            allDownloaded
              ? "bg-gray-100 text-gray-400 cursor-default"
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
              下载全部 ({results.length} 个文件)
            </>
          ) : (
            <>
              <Download className="h-4 w-4" />
              下载文件
            </>
          )}
        </button>
        <button
          onClick={onReset}
          className="inline-flex items-center justify-center gap-1.5 rounded-xl border px-6 py-3 text-sm font-medium text-gray-600 hover:bg-gray-50 hover:text-gray-900 transition-all active:scale-[0.98]"
        >
          <RotateCcw className="h-4 w-4" />
          继续处理
        </button>
      </div>
    </div>
  );
}
