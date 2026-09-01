"use client";

import { useState, useCallback } from "react";
import { ToolLayout } from "@/components/tools/tool-layout";
import { FileUpload } from "@/components/tools/file-upload";
import { getToolBySlug } from "@/config/tools";
import { getPDFInfo } from "@/lib/pdf-client";
import { formatFileSize } from "@/lib/utils";
import {
  FileText,
  Layers,
  HardDrive,
  User,
  Calendar,
  Tag,
  Boxes,
  Info,
  Copy,
  Check,
} from "lucide-react";

const tool = getToolBySlug("pdf-info")!;

interface PDFInfo {
  pageCount: number;
  fileSize: number;
  title?: string;
  author?: string;
  subject?: string;
  keywords?: string;
  creator?: string;
  producer?: string;
  creationDate?: Date;
  modificationDate?: Date;
  pdfVersion?: string;
}

function formatDate(d?: Date): string {
  if (!d) return "未设置";
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(
    d.getHours()
  )}:${pad(d.getMinutes())}`;
}

export default function PdfInfoPage() {
  const [files, setFiles] = useState<File[]>([]);
  const [info, setInfo] = useState<PDFInfo | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState<string | null>(null);

  const handleFilesSelected = useCallback(async (newFiles: File[]) => {
    setFiles((prev) => [...prev, ...newFiles]);
    setError(null);
    setInfo(null);
    if (newFiles.length > 0) {
      setIsLoading(true);
      try {
        const buffer = await newFiles[0].arrayBuffer();
        const result = await getPDFInfo(buffer);
        setInfo(result);
      } catch (err: any) {
        const msg = err?.message || "";
        if (msg.includes("已加密")) {
          setError("该 PDF 文件已加密，请先使用「解密 PDF」工具移除密码保护后再查看信息。");
        } else {
          setError("无法读取 PDF 文件，请确认文件格式是否正确或文件是否已损坏。");
        }
      } finally {
        setIsLoading(false);
      }
    }
  }, []);

  const handleRemoveFile = useCallback((index: number) => {
    setFiles((prev) => prev.filter((_, i) => i !== index));
    setInfo(null);
    setError(null);
  }, []);

  const handleClear = useCallback(() => {
    setFiles([]);
    setInfo(null);
    setIsLoading(false);
    setError(null);
  }, []);

  const handleCopy = useCallback(async (value: string, key: string) => {
    try {
      await navigator.clipboard.writeText(value);
      setCopied(key);
      setTimeout(() => setCopied(null), 1500);
    } catch {
      /* clipboard unavailable */
    }
  }, []);

  const infoRows: { key: string; label: string; value: string; icon: any }[] =
    info
      ? [
          {
            key: "pageCount",
            label: "页数",
            value: `${info.pageCount} 页`,
            icon: Layers,
          },
          {
            key: "fileSize",
            label: "文件大小",
            value: formatFileSize(info.fileSize),
            icon: HardDrive,
          },
          {
            key: "pdfVersion",
            label: "PDF 版本",
            value: info.pdfVersion || "未知",
            icon: Info,
          },
          {
            key: "title",
            label: "标题",
            value: info.title || "未设置",
            icon: FileText,
          },
          {
            key: "author",
            label: "作者",
            value: info.author || "未设置",
            icon: User,
          },
          {
            key: "subject",
            label: "主题",
            value: info.subject || "未设置",
            icon: Tag,
          },
          {
            key: "keywords",
            label: "关键词",
            value: info.keywords || "未设置",
            icon: Tag,
          },
          {
            key: "creator",
            label: "创建应用程序",
            value: info.creator || "未设置",
            icon: Boxes,
          },
          {
            key: "producer",
            label: "PDF 生产者",
            value: info.producer || "未设置",
            icon: Boxes,
          },
          {
            key: "creationDate",
            label: "创建时间",
            value: formatDate(info.creationDate),
            icon: Calendar,
          },
          {
            key: "modificationDate",
            label: "修改时间",
            value: formatDate(info.modificationDate),
            icon: Calendar,
          },
        ]
      : [];

  return (
    <ToolLayout tool={tool}>
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

        {isLoading && (
          <div className="flex items-center justify-center gap-2 rounded-xl border bg-white px-4 py-6 text-sm text-gray-500">
            <div className="h-4 w-4 animate-spin rounded-full border-2 border-primary border-t-transparent" />
            正在读取 PDF 信息...
          </div>
        )}

        {info && (
          <div className="animate-slide-up rounded-2xl border bg-white">
            {/* 摘要卡片 */}
            <div className="grid grid-cols-3 divide-x divide-gray-100 border-b">
              <div className="p-4 text-center">
                <Layers className="mx-auto h-6 w-6 text-primary" />
                <p className="mt-1 text-2xl font-bold text-gray-900">
                  {info.pageCount}
                </p>
                <p className="text-xs text-gray-400">总页数</p>
              </div>
              <div className="p-4 text-center">
                <HardDrive className="mx-auto h-6 w-6 text-primary" />
                <p className="mt-1 text-2xl font-bold text-gray-900">
                  {formatFileSize(info.fileSize).replace(" ", "")}
                </p>
                <p className="text-xs text-gray-400">文件大小</p>
              </div>
              <div className="p-4 text-center">
                <Info className="mx-auto h-6 w-6 text-primary" />
                <p className="mt-1 text-2xl font-bold text-gray-900">
                  {info.pdfVersion || "-"}
                </p>
                <p className="text-xs text-gray-400">PDF 版本</p>
              </div>
            </div>

            {/* 详细信息 */}
            <div className="p-5">
              <h3 className="text-sm font-semibold text-gray-700 mb-3">
                元数据详情
              </h3>
              <dl className="divide-y divide-gray-50">
                {infoRows.map((row) => (
                  <div
                    key={row.key}
                    className="flex items-center justify-between gap-4 py-2.5"
                  >
                    <dt className="flex items-center gap-2 text-sm text-gray-500 flex-shrink-0 w-32">
                      <row.icon className="h-4 w-4 text-gray-400" />
                      {row.label}
                    </dt>
                    <dd className="flex items-center gap-2 text-sm text-gray-900 text-right break-all flex-1 justify-end">
                      {row.value}
                      {row.value !== "未设置" && (
                        <button
                          type="button"
                          onClick={() => handleCopy(row.value, row.key)}
                          className="flex-shrink-0 text-gray-400 hover:text-primary transition-colors"
                          aria-label={`复制${row.label}`}
                        >
                          {copied === row.key ? (
                            <Check className="h-3.5 w-3.5 text-green-500" />
                          ) : (
                            <Copy className="h-3.5 w-3.5" />
                          )}
                        </button>
                      )}
                    </dd>
                  </div>
                ))}
              </dl>
            </div>
          </div>
        )}
      </div>
    </ToolLayout>
  );
}
