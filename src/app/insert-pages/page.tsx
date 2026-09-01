"use client";

import { useState, useCallback, useMemo, useRef } from "react";
import { PDFDocument } from "pdf-lib";
import { ToolLayout } from "@/components/tools/tool-layout";
import { FileUpload } from "@/components/tools/file-upload";
import { PageSelector } from "@/components/tools/page-selector";
import { ResultDownload } from "@/components/tools/result-download";
import { getToolBySlug } from "@/config/tools";
import { insertPDFPages, getPDFPageCount } from "@/lib/pdf-client";
import { FileUp, FilePlus2, FileText } from "lucide-react";
import { cn, friendlyError } from "@/lib/utils";

const tool = getToolBySlug("insert-pages")!;

type InsertType = "blank" | "fromFile";
type PositionType = "start" | "after" | "end";

export default function InsertPagesPage() {
  const [mainFiles, setMainFiles] = useState<File[]>([]);
  const [mainTotalPages, setMainTotalPages] = useState(0);
  // 主文档首页尺寸（空白页跟随）
  const [mainPageSize, setMainPageSize] = useState<{
    width: number;
    height: number;
  } | null>(null);

  const [positionType, setPositionType] = useState<PositionType>("end");
  const [afterPage, setAfterPage] = useState(1);

  const [insertType, setInsertType] = useState<InsertType>("blank");
  const [blankCount, setBlankCount] = useState(1);

  const [sourceFiles, setSourceFiles] = useState<File[]>([]);
  const [sourceTotalPages, setSourceTotalPages] = useState(0);
  const [sourceSelected, setSourceSelected] = useState<Set<number>>(new Set());

  const [isProcessing, setIsProcessing] = useState(false);
  const [results, setResults] = useState<
    { name: string; blob: Blob; size: number }[] | null
  >(null);
  const [progress, setProgress] = useState("");
  const [error, setError] = useState<string | null>(null);
  // 分析请求序号：防止旧文件的分析结果后到覆盖新状态
  const mainTokenRef = useRef(0);
  const sourceTokenRef = useRef(0);
  // 主文件分析是否成功（成功前禁止提交）
  const [mainAnalyzed, setMainAnalyzed] = useState(false);

  // 计算最终插入位置（0=开头, N=第N页之后, totalPages=结尾）
  const insertPosition = useMemo(() => {
    if (positionType === "start") return 0;
    if (positionType === "end") return mainTotalPages;
    return Math.max(0, Math.min(afterPage, mainTotalPages));
  }, [positionType, afterPage, mainTotalPages]);

  const handleMainFilesSelected = useCallback(
    async (newFiles: File[]) => {
      setMainFiles((prev) => [...prev, ...newFiles]);
      setError(null);
      setResults(null);
      setMainAnalyzed(false);
      if (newFiles.length > 0) {
        const token = ++mainTokenRef.current;
        try {
          const buffer = await newFiles[0].arrayBuffer();
          const pdf = await PDFDocument.load(buffer, { ignoreEncryption: true });
          if (token !== mainTokenRef.current) return; // 已被新请求/移除取代
          setMainTotalPages(pdf.getPageCount());
          const page = pdf.getPage(0);
          const { width, height } = page.getSize();
          setMainPageSize({ width, height });
          setAfterPage(1);
          setMainAnalyzed(true);
        } catch {
          if (token !== mainTokenRef.current) return;
          setMainTotalPages(0);
          setMainPageSize(null);
          setError("无法读取主 PDF 文件，请确认文件格式是否正确。");
        }
      }
    },
    []
  );

  const handleRemoveMainFile = useCallback((index: number) => {
    mainTokenRef.current++;
    setMainFiles((prev) => prev.filter((_, i) => i !== index));
    setMainTotalPages(0);
    setMainPageSize(null);
    setMainAnalyzed(false);
  }, []);

  const handleSourceFilesSelected = useCallback(
    async (newFiles: File[]) => {
      setSourceFiles((prev) => [...prev, ...newFiles]);
      setError(null);
      if (newFiles.length > 0) {
        const token = ++sourceTokenRef.current;
        try {
          const buffer = await newFiles[0].arrayBuffer();
          const count = await getPDFPageCount(buffer);
          if (token !== sourceTokenRef.current) return; // 已被新请求/移除取代
          setSourceTotalPages(count);
          setSourceSelected(new Set(Array.from({ length: count }, (_, i) => i + 1)));
        } catch {
          if (token !== sourceTokenRef.current) return;
          setError("无法读取源 PDF 文件，请确认文件格式是否正确。");
        }
      }
    },
    []
  );

  const handleRemoveSourceFile = useCallback((index: number) => {
    sourceTokenRef.current++;
    setSourceFiles((prev) => prev.filter((_, i) => i !== index));
    setSourceTotalPages(0);
    setSourceSelected(new Set());
  }, []);

  const handleClear = useCallback(() => {
    mainTokenRef.current++;
    sourceTokenRef.current++;
    setMainFiles([]);
    setMainTotalPages(0);
    setMainPageSize(null);
    setMainAnalyzed(false);
    setPositionType("end");
    setAfterPage(1);
    setInsertType("blank");
    setBlankCount(1);
    setSourceFiles([]);
    setSourceTotalPages(0);
    setSourceSelected(new Set());
    setResults(null);
    setProgress("");
    setError(null);
  }, []);

  const canProcess = useMemo(() => {
    if (mainFiles.length === 0) return false;
    if (!mainAnalyzed) return false; // 主文件分析失败/未完成时禁止提交
    if (insertType === "blank") return blankCount >= 1;
    return sourceFiles.length > 0 && sourceSelected.size > 0;
  }, [mainFiles.length, mainAnalyzed, insertType, blankCount, sourceFiles.length, sourceSelected.size]);

  const handleInsert = useCallback(async () => {
    if (!canProcess) {
      setError(insertType === "blank" ? "请设置要插入的空白页数量。" : "请上传源 PDF 文件并选择要导入的页面。");
      return;
    }

    setIsProcessing(true);
    setError(null);

    try {
      const mainFile = mainFiles[0];
      const header = await mainFile.slice(0, 5).text();
      if (!header.includes("%PDF")) {
        throw new Error(`"${mainFile.name}" 不是有效的 PDF 文件。`);
      }

      setProgress("正在插入页面...");
      const mainBuffer = await mainFile.arrayBuffer();

      const insertOptions: Parameters<typeof insertPDFPages>[1] = {
        position: insertPosition,
        type: insertType,
      };

      if (insertType === "blank") {
        insertOptions.blankPages = {
          count: Math.min(100, Math.max(1, Math.floor(blankCount) || 1)),
          width: mainPageSize?.width || 595.28,
          height: mainPageSize?.height || 841.89,
        };
      } else {
        const sourceFile = sourceFiles[0];
        const sourceHeader = await sourceFile.slice(0, 5).text();
        if (!sourceHeader.includes("%PDF")) {
          throw new Error(`"${sourceFile.name}" 不是有效的 PDF 文件。`);
        }
        insertOptions.fromFileBuffer = await sourceFile.arrayBuffer();
        insertOptions.fromFilePageNumbers = Array.from(sourceSelected).sort((a, b) => a - b);
      }

      const resultBytes = await insertPDFPages(mainBuffer, insertOptions);

      const blob = new Blob([resultBytes], { type: "application/pdf" });
      if (blob.size === 0) {
        throw new Error("处理后的文件为空，请重试。");
      }

      const baseName = mainFile.name.replace(/\.pdf$/i, "");
      setResults([
        {
          name: `${baseName}-已插入.pdf`,
          blob,
          size: blob.size,
        },
      ]);
      setProgress("");
    } catch (err: any) {
      console.error("Insert pages failed:", err);
      setError(friendlyError(err, "插入失败，请确保文件是有效的 PDF 格式。"));
    } finally {
      setIsProcessing(false);
      setProgress("");
    }
  }, [canProcess, mainFiles, insertType, insertPosition, blankCount, mainPageSize, sourceFiles, sourceSelected]);

  return (
    <ToolLayout tool={tool}>
      {!results ? (
        <div className="space-y-6">
          {/* 第一步：上传主文档 */}
          <div>
            <div className="mb-2 flex items-center gap-2">
              <span className="flex h-6 w-6 items-center justify-center rounded-full bg-primary/10 text-primary text-xs font-bold">
                1
              </span>
              <label className="text-sm font-medium text-gray-700">
                上传主文档
              </label>
            </div>
            <FileUpload
              onFilesSelected={handleMainFilesSelected}
              multiple={false}
              accept=".pdf"
              acceptDescription="PDF"
              maxFiles={1}
              maxSizeMB={50}
              files={mainFiles}
              onRemoveFile={handleRemoveMainFile}
              onClear={handleClear}
            />
          </div>

          {error && (
            <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3">
              <p className="text-sm text-red-600">{error}</p>
            </div>
          )}

          {mainFiles.length > 0 && !mainAnalyzed && (
            <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3">
              <p className="text-sm text-red-600">
                无法读取该 PDF 文件，请确认文件格式正确或未被加密。请移除后重新上传。
              </p>
            </div>
          )}

          {mainFiles.length > 0 && mainAnalyzed && (
            <div className="animate-slide-up space-y-5">
              {/* 第二步：插入位置 */}
              <div className="rounded-2xl border bg-white p-5">
                <div className="mb-3 flex items-center gap-2">
                  <span className="flex h-6 w-6 items-center justify-center rounded-full bg-primary/10 text-primary text-xs font-bold">
                    2
                  </span>
                  <label className="text-sm font-medium text-gray-700">
                    选择插入位置
                  </label>
                </div>
                <div className="flex flex-wrap gap-2">
                  {(
                    [
                      { id: "start", name: "文档开头" },
                      { id: "after", name: "指定页之后" },
                      { id: "end", name: "文档结尾" },
                    ] as const
                  ).map((opt) => (
                    <button
                      key={opt.id}
                      type="button"
                      onClick={() => setPositionType(opt.id)}
                      className={cn(
                        "rounded-lg border px-4 py-2 text-sm transition-all",
                        positionType === opt.id
                          ? "border-primary bg-primary/5 text-primary font-medium"
                          : "border-gray-200 text-gray-600 hover:border-gray-300"
                      )}
                    >
                      {opt.name}
                    </button>
                  ))}
                </div>
                {positionType === "after" && (
                  <div className="mt-3 flex items-center gap-2">
                    <label htmlFor="after-page" className="text-sm text-gray-500">
                      在第
                    </label>
                    <input
                      id="after-page"
                      type="number"
                      min={1}
                      max={mainTotalPages}
                      value={afterPage}
                      onChange={(e) =>
                        setAfterPage(
                          Math.max(1, Math.min(mainTotalPages, parseInt(e.target.value) || 1))
                        )
                      }
                      className="w-20 rounded-lg border border-gray-300 px-3 py-1.5 text-center text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
                    />
                    <label htmlFor="after-page" className="text-sm text-gray-500">
                      页之后（共 {mainTotalPages} 页）
                    </label>
                  </div>
                )}
              </div>

              {/* 第三步：插入内容 */}
              <div className="rounded-2xl border bg-white p-5">
                <div className="mb-3 flex items-center gap-2">
                  <span className="flex h-6 w-6 items-center justify-center rounded-full bg-primary/10 text-primary text-xs font-bold">
                    3
                  </span>
                  <label className="text-sm font-medium text-gray-700">
                    选择插入内容
                  </label>
                </div>

                <div className="flex flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={() => setInsertType("blank")}
                    className={cn(
                      "rounded-lg border px-4 py-2 text-sm transition-all flex items-center gap-1.5",
                      insertType === "blank"
                        ? "border-primary bg-primary/5 text-primary font-medium"
                        : "border-gray-200 text-gray-600 hover:border-gray-300"
                    )}
                  >
                    <FilePlus2 className="h-4 w-4" />
                    空白页
                  </button>
                  <button
                    type="button"
                    onClick={() => setInsertType("fromFile")}
                    className={cn(
                      "rounded-lg border px-4 py-2 text-sm transition-all flex items-center gap-1.5",
                      insertType === "fromFile"
                        ? "border-primary bg-primary/5 text-primary font-medium"
                        : "border-gray-200 text-gray-600 hover:border-gray-300"
                    )}
                  >
                    <FileText className="h-4 w-4" />
                    从其他 PDF 导入
                  </button>
                </div>

                {insertType === "blank" ? (
                  <div className="mt-4">
                    <label
                      htmlFor="blank-count"
                      className="block text-sm text-gray-500 mb-2"
                    >
                      插入空白页数量（1-100）
                    </label>
                    <input
                      id="blank-count"
                      type="number"
                      min={1}
                      max={100}
                      value={blankCount}
                      onChange={(e) =>
                        setBlankCount(Math.max(1, Math.min(100, parseInt(e.target.value) || 1)))
                      }
                      className="w-32 rounded-lg border border-gray-300 px-3 py-2 text-center text-base font-semibold outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
                    />
                    {mainPageSize && (
                      <p className="mt-2 text-xs text-gray-400">
                        尺寸跟随主文档首页（约{" "}
                        {Math.round(mainPageSize.width / 2.8346)} ×{" "}
                        {Math.round(mainPageSize.height / 2.8346)} mm）
                      </p>
                    )}
                  </div>
                ) : (
                  <div className="mt-4 space-y-4">
                    <FileUpload
                      onFilesSelected={handleSourceFilesSelected}
                      multiple={false}
                      accept=".pdf"
                      acceptDescription="PDF"
                      maxFiles={1}
                      maxSizeMB={50}
                      files={sourceFiles}
                      onRemoveFile={handleRemoveSourceFile}
                      onClear={() => {
                        setSourceFiles([]);
                        setSourceTotalPages(0);
                        setSourceSelected(new Set());
                      }}
                    />
                    {sourceFiles.length > 0 && sourceTotalPages > 0 && (
                      <div className="rounded-xl bg-gray-50 p-4">
                        <PageSelector
                          totalPages={sourceTotalPages}
                          selectedPages={sourceSelected}
                          onSelectionChange={setSourceSelected}
                          label="选择要导入的页面"
                        />
                      </div>
                    )}
                  </div>
                )}
              </div>

              <button
                onClick={handleInsert}
                disabled={isProcessing || !canProcess}
                className="w-full rounded-xl bg-gradient-to-r from-violet-500 to-violet-600 px-6 py-3.5 text-base font-semibold text-white shadow-sm hover:from-violet-600 hover:to-violet-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all active:scale-[0.99]"
              >
                {isProcessing ? (
                  <span className="flex items-center justify-center gap-2">
                    <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                    {progress || "处理中..."}
                  </span>
                ) : (
                  <span className="flex items-center justify-center gap-2">
                    <FileUp className="h-4 w-4" />
                    插入页面并下载
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
