"use client";

import { useState, useCallback, useMemo } from "react";
import { friendlyError } from "@/lib/utils";
import { ImagePlus, Move } from "lucide-react";
import { ToolLayout } from "@/components/tools/tool-layout";
import { FileUpload } from "@/components/tools/file-upload";
import { ResultDownload } from "@/components/tools/result-download";
import { SignaturePad } from "@/components/tools/signature-pad";
import { getToolBySlug } from "@/config/tools";
import { signPDF, getPDFPageCount } from "@/lib/pdf-client";

const tool = getToolBySlug("sign-pdf")!;

const POSITIONS = [
  { id: "bottom-right", label: "右下角" },
  { id: "bottom-center", label: "底部居中" },
  { id: "top-right", label: "右上角" },
  { id: "center", label: "居中" },
] as const;

export default function SignPDFPage() {
  const [files, setFiles] = useState<File[]>([]);
  const [pageCount, setPageCount] = useState<number | null>(null);
  const [signature, setSignature] = useState<string | null>(null);
  const [uploadedSig, setUploadedSig] = useState<string | null>(null);
  const [position, setPosition] = useState<string>("bottom-right");
  const [widthPercent, setWidthPercent] = useState(25);
  const [targetPage, setTargetPage] = useState<number>(0); // 0 = 最后一页
  const [isProcessing, setIsProcessing] = useState(false);
  const [progress, setProgress] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [results, setResults] = useState<{ name: string; blob: Blob; size: number }[] | null>(null);

  const activeSignature = useMemo(() => uploadedSig || signature, [signature, uploadedSig]);

  const handleFilesSelected = useCallback((newFiles: File[]) => {
    setFiles(newFiles);
    setError(null);
    setResults(null);
    setPageCount(null);
  }, []);

  const handleClear = useCallback(() => {
    setFiles([]);
    setSignature(null);
    setUploadedSig(null);
    setPageCount(null);
    setTargetPage(0);
    setResults(null);
    setProgress("");
    setError(null);
  }, []);

  // 当文件上传后读取页数
  const handleAnalyze = useCallback(async () => {
    if (files.length === 0) return;
    try {
      const buf = await files[0].arrayBuffer();
      const count = await getPDFPageCount(buf);
      setPageCount(count);
    } catch {
      setPageCount(null);
    }
  }, [files]);

  // 上传图片签名
  const handleSigImage = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const f = e.target.files?.[0];
      if (!f) return;
      const reader = new FileReader();
      reader.onload = () => {
        setUploadedSig(reader.result as string);
        setError(null);
      };
      reader.readAsDataURL(f);
    },
    []
  );

  const handleSign = useCallback(async () => {
    if (files.length === 0) {
      setError("请先上传需要签署的 PDF 文件。");
      return;
    }
    if (!activeSignature) {
      setError("请先绘制签名或上传签名图片。");
      return;
    }

    setIsProcessing(true);
    setError(null);
    try {
      setProgress("正在签署文档...");
      const buf = await files[0].arrayBuffer();
      const outBuf = await signPDF(buf, activeSignature, {
        pageNumber: targetPage === 0 ? undefined : targetPage,
        position: position as any,
        widthPercent,
      });
      const blob = new Blob([outBuf], { type: "application/pdf" });
      if (blob.size === 0) throw new Error("生成的文件为空，请重试。");
      const resultName = files[0].name.replace(/\.pdf$/i, "-signed.pdf");
      setResults([{ name: resultName, blob, size: blob.size }]);
      setProgress("");
    } catch (err: any) {
      console.error("Sign failed:", err);
      setError(friendlyError(err, "签署失败，请检查 PDF 文件是否有效。"));
    } finally {
      setIsProcessing(false);
      setProgress("");
    }
  }, [files, activeSignature, position, widthPercent, targetPage]);

  return (
    <ToolLayout tool={tool}>
      {!results ? (
        <div className="space-y-6">
          <div className="rounded-xl bg-indigo-50 border border-indigo-100 p-4 text-sm text-indigo-700">
            <p className="font-medium">💡 使用提示</p>
            <p className="mt-1 text-indigo-600">
              支持两种签名方式：<strong>手绘签名</strong>（鼠标/手指书写）或
              <strong>上传签名图片</strong>。签名尺寸和位置均可自定义，默认放置在最后一页。
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
            onRemoveFile={handleClear}
            onClear={handleClear}
          />

          {files.length > 0 && !pageCount && (
            <button
              onClick={handleAnalyze}
              className="w-full rounded-xl border border-indigo-200 bg-indigo-50 px-6 py-2.5 text-sm font-medium text-indigo-700 hover:bg-indigo-100 transition-colors"
            >
              读取文档页数
            </button>
          )}

          {pageCount !== null && (
            <div className="rounded-2xl border bg-white p-5 space-y-5 animate-slide-up">
              <p className="text-sm font-medium text-gray-700">
                文档共 {pageCount} 页
              </p>

              {/* 签名方式 Tabs */}
              <div>
                <p className="mb-2 text-sm font-medium text-gray-700">1. 选择签名方式</p>
                <div className="grid grid-cols-2 gap-3">
                  <div className="rounded-xl border p-4 space-y-3">
                    <p className="text-sm font-medium text-gray-700">🖊️ 手绘签名</p>
                    <SignaturePad
                      value={signature || undefined}
                      onChange={(v) => {
                        setSignature(v);
                        if (v) setUploadedSig(null);
                      }}
                      height={160}
                    />
                  </div>
                  <div className="rounded-xl border p-4 space-y-3">
                    <p className="text-sm font-medium text-gray-700">🖼️ 上传签名图片</p>
                    <label className="flex flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed border-gray-200 p-6 cursor-pointer hover:border-indigo-400/50 hover:bg-gray-50/50 transition-all min-h-[160px]">
                      <ImagePlus className="h-8 w-8 text-gray-300" />
                      <span className="text-sm text-gray-500">
                        {uploadedSig ? "已选择，点击更换" : "点击选择签名图片"}
                      </span>
                      <input
                        type="file"
                        accept=".png,.jpg,.jpeg"
                        className="hidden"
                        onChange={handleSigImage}
                      />
                    </label>
                    {uploadedSig && (
                      <img
                        src={uploadedSig}
                        alt="签名预览"
                        className="h-20 mx-auto rounded-lg border bg-white object-contain"
                      />
                    )}
                  </div>
                </div>
              </div>

              {/* 位置与尺寸 */}
              <div>
                <p className="mb-2 text-sm font-medium text-gray-700">2. 签名位置与大小</p>
                <div className="grid sm:grid-cols-2 gap-4">
                  <div>
                    <label className="mb-1.5 block text-xs font-medium text-gray-500">
                      签名位置
                    </label>
                    <div className="flex flex-wrap gap-2">
                      {POSITIONS.map((p) => (
                        <button
                          key={p.id}
                          onClick={() => setPosition(p.id)}
                          className={`px-3 py-1.5 rounded-lg text-sm border transition-all ${
                            position === p.id
                              ? "border-indigo-500 bg-indigo-50 text-indigo-700 font-medium"
                              : "border-gray-200 text-gray-600 hover:border-indigo-300"
                          }`}
                        >
                          {p.label}
                        </button>
                      ))}
                    </div>
                  </div>
                  <div>
                    <label className="mb-1.5 block text-xs font-medium text-gray-500">
                      签名大小：页宽的 {widthPercent}%
                    </label>
                    <input
                      type="range"
                      min={10}
                      max={50}
                      value={widthPercent}
                      onChange={(e) => setWidthPercent(Number(e.target.value))}
                      className="w-full"
                    />
                  </div>
                </div>
              </div>

              {/* 页码选择 */}
              <div>
                <p className="mb-2 text-sm font-medium text-gray-700">3. 签署到哪一页</p>
                <div className="flex flex-wrap gap-2">
                  <button
                    onClick={() => setTargetPage(0)}
                    className={`px-3 py-1.5 rounded-lg text-sm border transition-all ${
                      targetPage === 0
                        ? "border-indigo-500 bg-indigo-50 text-indigo-700 font-medium"
                        : "border-gray-200 text-gray-600 hover:border-indigo-300"
                    }`}
                  >
                    最后一页（推荐）
                  </button>
                  <button
                    onClick={() => setTargetPage(1)}
                    className={`px-3 py-1.5 rounded-lg text-sm border transition-all ${
                      targetPage === 1
                        ? "border-indigo-500 bg-indigo-50 text-indigo-700 font-medium"
                        : "border-gray-200 text-gray-600 hover:border-indigo-300"
                    }`}
                  >
                    第一页
                  </button>
                  {pageCount > 1 && (
                    <div className="flex items-center gap-1.5">
                      <label className="text-sm text-gray-500">指定页码</label>
                      <input
                        type="number"
                        min={1}
                        max={pageCount}
                        value={targetPage > 0 ? targetPage : ""}
                        onChange={(e) => {
                          const v = Number(e.target.value);
                          setTargetPage(v >= 1 && v <= pageCount ? v : 0);
                        }}
                        className="w-20 rounded-lg border border-gray-200 px-2 py-1.5 text-sm text-center"
                      />
                    </div>
                  )}
                </div>
                {targetPage > 0 && (
                  <p className="mt-1 text-xs text-gray-400 flex items-center gap-1">
                    <Move className="h-3 w-3" /> 将签署到第 {targetPage} 页
                  </p>
                )}
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
              onClick={handleSign}
              disabled={isProcessing || !activeSignature}
              className="w-full rounded-xl bg-gradient-to-r from-indigo-500 to-indigo-600 px-6 py-3.5 text-base font-semibold text-white shadow-sm hover:from-indigo-600 hover:to-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all active:scale-[0.99]"
            >
              {isProcessing ? (
                <span className="flex items-center justify-center gap-2">
                  <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                  {progress || "签署中..."}
                </span>
              ) : activeSignature ? (
                "签署 PDF 并下载"
              ) : (
                "请先添加签名"
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
