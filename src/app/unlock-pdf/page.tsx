"use client";

import { useState, useCallback } from "react";
import { ToolLayout } from "@/components/tools/tool-layout";
import { FileUpload } from "@/components/tools/file-upload";
import { PasswordInput } from "@/components/tools/password-input";
import { ResultDownload } from "@/components/tools/result-download";
import { getToolBySlug } from "@/config/tools";
import { unprotectPDF, checkPDFEncryption } from "@/lib/pdf-client";
import { Unlock, ShieldAlert, ShieldCheck } from "lucide-react";

const tool = getToolBySlug("unlock-pdf")!;

export default function UnlockPdfPage() {
  const [files, setFiles] = useState<File[]>([]);
  const [password, setPassword] = useState("");
  const [encryptionStatus, setEncryptionStatus] = useState<{
    checked: boolean;
    isEncrypted: boolean;
    checkFailed?: boolean;
  }>({ checked: false, isEncrypted: false });
  const [isProcessing, setIsProcessing] = useState(false);
  const [results, setResults] = useState<
    { name: string; blob: Blob; size: number }[] | null
  >(null);
  const [progress, setProgress] = useState("");
  const [error, setError] = useState<string | null>(null);

  const handleFilesSelected = useCallback(async (newFiles: File[]) => {
    setFiles((prev) => [...prev, ...newFiles]);
    setError(null);
    setResults(null);
    setPassword("");
    setEncryptionStatus({ checked: false, isEncrypted: false });
    if (newFiles.length > 0) {
      try {
        const buffer = await newFiles[0].arrayBuffer();
        const info = await checkPDFEncryption(buffer);
        setEncryptionStatus({ checked: true, isEncrypted: info.isEncrypted });
      } catch {
        // 无法解析（损坏/非 PDF）时不要误判为"加密"，置为检测失败
        setEncryptionStatus({ checked: true, isEncrypted: false, checkFailed: true });
      }
    }
  }, []);

  const handleRemoveFile = useCallback((index: number) => {
    setFiles((prev) => prev.filter((_, i) => i !== index));
  }, []);

  const handleClear = useCallback(() => {
    setFiles([]);
    setPassword("");
    setEncryptionStatus({ checked: false, isEncrypted: false });
    setResults(null);
    setProgress("");
    setError(null);
  }, []);

  const handleUnlock = useCallback(async () => {
    if (files.length === 0) {
      setError("请先选择一个 PDF 文件。");
      return;
    }
    if (encryptionStatus.isEncrypted && !password) {
      setError("该文件有密码保护，请输入打开密码。");
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

      setProgress("正在解密...");
      const buffer = await file.arrayBuffer();
      const resultBytes = await unprotectPDF(buffer, password);

      const blob = new Blob([resultBytes], { type: "application/pdf" });
      if (blob.size === 0) {
        throw new Error("解密后的文件为空，请重试。");
      }

      const baseName = file.name.replace(/\.pdf$/i, "");
      setResults([
        {
          name: `${baseName}-已解锁.pdf`,
          blob,
          size: blob.size,
        },
      ]);
      setProgress("");
    } catch (err: any) {
      console.error("Unlock PDF failed:", err);
      const msg = err?.message || "";
      if (msg.includes("WRONG_PASSWORD")) {
        setError("密码错误，无法解密该文件。请确认输入的密码正确。");
      } else if (msg.includes("INVALID_PASSWORD")) {
        setError("请输入打开密码后再尝试解密。");
      } else if (msg.includes("XREF_STREAM_UNSUPPORTED")) {
        setError("该文件使用了较新的压缩结构（PDF 1.5+），浏览器端暂无法解密。建议使用桌面端软件处理。");
      } else if (msg.includes("CORRUPT_PDF") || msg.includes("损坏") || msg.includes("无法读取")) {
        setError("文件已损坏或无法读取，请确认文件是有效的 PDF 格式。");
      } else {
        setError(msg || "解密失败，请确保文件是有效的 PDF 格式。");
      }
    } finally {
      setIsProcessing(false);
      setProgress("");
    }
  }, [files, password, encryptionStatus.isEncrypted]);

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

          {files.length > 0 && (
            <div className="animate-slide-up space-y-4">
              <div className="rounded-2xl border bg-white p-5 space-y-4">
                {/* 加密状态提示 */}
                {encryptionStatus.checked && (
                  encryptionStatus.checkFailed ? (
                    <div className="rounded-lg bg-red-50 border border-red-100 px-4 py-3 text-sm text-red-700 flex items-start gap-2">
                      <ShieldAlert className="h-5 w-5 flex-shrink-0 mt-0.5" />
                      <div>
                        <p className="font-medium">无法读取该文件</p>
                        <p className="mt-0.5 text-red-600">
                          文件可能已损坏或不是有效的 PDF，请确认后重试。
                        </p>
                      </div>
                    </div>
                  ) : encryptionStatus.isEncrypted ? (
                    <div className="rounded-lg bg-amber-50 border border-amber-100 px-4 py-3 text-sm text-amber-700 flex items-start gap-2">
                      <ShieldAlert className="h-5 w-5 flex-shrink-0 mt-0.5" />
                      <div>
                        <p className="font-medium">检测到密码保护</p>
                        <p className="mt-0.5 text-amber-600">
                          该 PDF 文件受密码保护，请输入正确的打开密码以解锁。
                        </p>
                      </div>
                    </div>
                  ) : (
                    <div className="rounded-lg bg-green-50 border border-green-100 px-4 py-3 text-sm text-green-700 flex items-start gap-2">
                      <ShieldCheck className="h-5 w-5 flex-shrink-0 mt-0.5" />
                      <div>
                        <p className="font-medium">文件未加密</p>
                        <p className="mt-0.5 text-green-600">
                          该 PDF 文件没有打开密码，点击下方按钮即可移除可能的编辑限制。
                        </p>
                      </div>
                    </div>
                  )
                )}

                {encryptionStatus.isEncrypted && (
                  <PasswordInput
                    value={password}
                    onChange={setPassword}
                    label="打开密码"
                    placeholder="输入 PDF 的打开密码"
                    id="unlock-password"
                    showStrength={false}
                    autoComplete="current-password"
                  />
                )}
              </div>

              <button
                onClick={handleUnlock}
                disabled={isProcessing || (encryptionStatus.isEncrypted && !password)}
                className="w-full rounded-xl bg-gradient-to-r from-teal-500 to-teal-600 px-6 py-3.5 text-base font-semibold text-white shadow-sm hover:from-teal-600 hover:to-teal-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all active:scale-[0.99]"
              >
                {isProcessing ? (
                  <span className="flex items-center justify-center gap-2">
                    <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                    {progress || "处理中..."}
                  </span>
                ) : (
                  <span className="flex items-center justify-center gap-2">
                    <Unlock className="h-4 w-4" />
                    解密 PDF
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
