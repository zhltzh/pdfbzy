"use client";

import { useState, useCallback } from "react";
import { ToolLayout } from "@/components/tools/tool-layout";
import { FileUpload } from "@/components/tools/file-upload";
import { getToolBySlug } from "@/config/tools";
import { getPDFInfo } from "@/lib/pdf-client";
import { downloadFile, formatFileSize, friendlyError } from "@/lib/utils";
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
  Download,
} from "lucide-react";

const tool = getToolBySlug("pdf-info")!;

const MAX_FILES = 10;

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

interface PDFInfoEntry {
  name: string;
  size: number;
  info: PDFInfo;
}

function formatDate(d?: Date): string {
  if (!d) return "未设置";
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(
    d.getHours()
  )}:${pad(d.getMinutes())}`;
}

function buildInfoRows(info: PDFInfo): {
  key: string;
  label: string;
  value: string;
  icon: any;
}[] {
  return [
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
  ];
}

export default function PdfInfoPage() {
  const [files, setFiles] = useState<File[]>([]);
  const [infos, setInfos] = useState<PDFInfoEntry[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [progress, setProgress] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState<string | null>(null);

  const handleFilesSelected = useCallback(
    async (newFiles: File[]) => {
      const added = newFiles.filter(
        (f) => !files.some((p) => p.name === f.name && p.size === f.size)
      );
      const merged = [...files, ...added].slice(0, MAX_FILES);
      setFiles(merged);
      setError(null);
      if (added.length === 0) return;

      setIsLoading(true);
      const results: PDFInfoEntry[] = [];
      const failures: string[] = [];

      for (let i = 0; i < added.length; i++) {
        const file = added[i];
        setProgress(
          `正在读取第 ${files.length + i + 1}/${merged.length} 个文件...`
        );
        try {
          const buffer = await file.arrayBuffer();
          const info = await getPDFInfo(buffer);
          results.push({ name: file.name, size: file.size, info });
        } catch (err: any) {
          const msg = err?.message || "";
          failures.push(
            msg.includes("已加密")
              ? `「${file.name}」已加密，请先使用「解密 PDF」工具移除密码保护后再查看信息。`
              : friendlyError(
                  err,
                  `无法读取「${file.name}」，请确认文件格式是否正确或文件是否已损坏。`
                )
          );
        }
      }

      setInfos((prev) => [...prev, ...results]);
      if (failures.length > 0) setError(failures.join("\n"));
      setIsLoading(false);
      setProgress("");
    },
    [files]
  );

  const handleRemoveFile = useCallback(
    (index: number) => {
      const target = files[index];
      setFiles((prev) => prev.filter((_, i) => i !== index));
      if (target) {
        setInfos((prev) =>
          prev.filter(
            (entry) =>
              !(entry.name === target.name && entry.size === target.size)
          )
        );
      }
      setError(null);
    },
    [files]
  );

  const handleClear = useCallback(() => {
    setFiles([]);
    setInfos([]);
    setIsLoading(false);
    setProgress("");
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

  const handleExportTxt = useCallback(() => {
    if (infos.length === 0) return;
    const blocks = infos.map((entry, index) => {
      const rows = buildInfoRows(entry.info)
        .map((row) => `${row.label}：${row.value}`)
        .join("\n");
      return `=== ${index + 1}. ${entry.name} ===\n${rows}`;
    });
    const text = `PDF 信息报告\n共 ${infos.length} 个文件\n\n${blocks.join(
      "\n\n"
    )}\n`;
    downloadFile(
      new Blob([text], { type: "text/plain;charset=utf-8" }),
      "pdf-info.txt"
    );
  }, [infos]);

  return (
    <ToolLayout tool={tool}>
      <div className="space-y-6">
        <FileUpload
          onFilesSelected={handleFilesSelected}
          multiple
          accept=".pdf"
          acceptDescription="PDF"
          maxFiles={MAX_FILES}
          maxSizeMB={50}
          files={files}
          onRemoveFile={handleRemoveFile}
          onClear={handleClear}
        />

        {error && (
          <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3">
            <p className="whitespace-pre-line text-sm text-red-600">{error}</p>
          </div>
        )}

        {isLoading && (
          <div className="flex items-center justify-center gap-2 rounded-xl border bg-white px-4 py-6 text-sm text-gray-500">
            <div className="h-4 w-4 animate-spin rounded-full border-2 border-primary border-t-transparent" />
            {progress || "正在读取 PDF 信息..."}
          </div>
        )}

        {infos.length > 0 && (
          <div className="space-y-4">
            {/* 操作条 */}
            <div className="flex items-center justify-between gap-3 rounded-xl border bg-white px-4 py-3">
              <p className="text-sm text-gray-600">
                已读取{" "}
                <span className="font-semibold text-gray-900">
                  {infos.length}
                </span>{" "}
                个文件
              </p>
              <button
                type="button"
                onClick={handleExportTxt}
                className="inline-flex items-center gap-1.5 rounded-lg border border-primary/30 bg-primary/5 px-3 py-1.5 text-sm font-medium text-primary hover:bg-primary/10 transition-colors"
              >
                <Download className="h-4 w-4" />
                导出信息为 TXT
              </button>
            </div>

            {infos.map((entry, index) => {
              const infoRows = buildInfoRows(entry.info);
              return (
                <div
                  key={`${entry.name}-${entry.size}-${index}`}
                  className="animate-slide-up rounded-2xl border bg-white"
                >
                  {/* 文件名 */}
                  <div className="flex items-center gap-2 border-b px-4 py-3">
                    <FileText className="h-4 w-4 flex-shrink-0 text-gray-400" />
                    <p className="truncate text-sm font-medium text-gray-800">
                      {entry.name}
                    </p>
                  </div>

                  {/* 摘要卡片 */}
                  <div className="grid grid-cols-3 divide-x divide-gray-100 border-b">
                    <div className="p-4 text-center">
                      <Layers className="mx-auto h-6 w-6 text-primary" />
                      <p className="mt-1 text-2xl font-bold text-gray-900">
                        {entry.info.pageCount}
                      </p>
                      <p className="text-xs text-gray-400">总页数</p>
                    </div>
                    <div className="p-4 text-center">
                      <HardDrive className="mx-auto h-6 w-6 text-primary" />
                      <p className="mt-1 text-2xl font-bold text-gray-900">
                        {formatFileSize(entry.info.fileSize).replace(" ", "")}
                      </p>
                      <p className="text-xs text-gray-400">文件大小</p>
                    </div>
                    <div className="p-4 text-center">
                      <Info className="mx-auto h-6 w-6 text-primary" />
                      <p className="mt-1 text-2xl font-bold text-gray-900">
                        {entry.info.pdfVersion || "-"}
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
                      {infoRows.map((row) => {
                        const copyKey = `${index}-${row.key}`;
                        return (
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
                                  onClick={() => handleCopy(row.value, copyKey)}
                                  className="flex-shrink-0 text-gray-400 hover:text-primary transition-colors"
                                  aria-label={`复制${row.label}`}
                                >
                                  {copied === copyKey ? (
                                    <Check className="h-3.5 w-3.5 text-green-500" />
                                  ) : (
                                    <Copy className="h-3.5 w-3.5" />
                                  )}
                                </button>
                              )}
                            </dd>
                          </div>
                        );
                      })}
                    </dl>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </ToolLayout>
  );
}
