"use client";

import { useState, useCallback } from "react";
import { friendlyError } from "@/lib/utils";
import { ToolLayout } from "@/components/tools/tool-layout";
import { FileUpload } from "@/components/tools/file-upload";
import { PasswordInput } from "@/components/tools/password-input";
import { ResultDownload } from "@/components/tools/result-download";
import { getToolBySlug } from "@/config/tools";
import { protectPDF, checkPDFEncryption } from "@/lib/pdf-client";
import { Lock } from "lucide-react";

const tool = getToolBySlug("protect-pdf")!;

export default function ProtectPdfPage() {
  const [files, setFiles] = useState<File[]>([]);
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);
  const [results, setResults] = useState<
    { name: string; blob: Blob; size: number }[] | null
  >(null);
  const [progress, setProgress] = useState("");
  const [error, setError] = useState<string | null>(null);

  const handleFilesSelected = useCallback(
    async (newFiles: File[]) => {
      setFiles((prev) => [...prev, ...newFiles]);
      setError(null);
      setResults(null);
      // 检测文件是否已加密
      if (newFiles.length > 0) {
        try {
          const buffer = await newFiles[0].arrayBuffer();
          const info = await checkPDFEncryption(buffer);
          if (info.isEncrypted) {
            setError("该文件已有密码保护。如需重新加密，请先使用「解密 PDF」工具解锁后再操作。");
          }
        } catch {
          // 忽略解析失败，由加密流程兜底报错
        }
      }
    },
    []
  );

  const handleRemoveFile = useCallback((index: number) => {
    setFiles((prev) => prev.filter((_, i) => i !== index));
  }, []);

  const handleClear = useCallback(() => {
    setFiles([]);
    setPassword("");
    setConfirmPassword("");
    setResults(null);
    setProgress("");
    setError(null);
  }, []);

  const handleProtect = useCallback(async () => {
    if (files.length === 0) {
      setError("请先选择一个 PDF 文件。");
      return;
    }
    if (!password) {
      setError("请设置加密密码。");
      return;
    }
    if (password !== confirmPassword) {
      setError("两次输入的密码不一致，请重新确认。");
      return;
    }
    if (password.length < 6) {
      setError("密码长度至少 6 位，建议使用更复杂的密码。");
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

      setProgress("正在加密...");
      const buffer = await file.arrayBuffer();
      const resultBytes = await protectPDF(buffer, password);

      const blob = new Blob([resultBytes], { type: "application/pdf" });
      if (blob.size === 0) {
        throw new Error("加密后的文件为空，请重试。");
      }

      const baseName = file.name.replace(/\.pdf$/i, "");
      setResults([
        {
          name: `${baseName}-加密.pdf`,
          blob,
          size: blob.size,
        },
      ]);
      setProgress("");
    } catch (err: any) {
      console.error("Protect PDF failed:", err);
      setError(friendlyError(err, "加密失败，请确保文件是有效的 PDF 格式。"));
    } finally {
      setIsProcessing(false);
      setProgress("");
    }
  }, [files, password, confirmPassword]);

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
                <PasswordInput
                  value={password}
                  onChange={setPassword}
                  label="打开密码"
                  placeholder="设置打开文档所需的密码"
                  id="password"
                  autoComplete="new-password"
                />
                <PasswordInput
                  value={confirmPassword}
                  onChange={setConfirmPassword}
                  confirmValue={password}
                  label="确认密码"
                  placeholder="再次输入密码"
                  id="confirm-password"
                  showStrength={false}
                  autoComplete="new-password"
                />
                <div className="rounded-lg bg-gray-50 px-4 py-3 text-xs text-gray-500">
                  <p className="flex items-center gap-1.5">
                    <Lock className="h-3.5 w-3.5" />
                    加密采用 AES-256 位算法，密码一旦设置无法找回，请务必妥善保管。
                  </p>
                </div>
              </div>

              <button
                onClick={handleProtect}
                disabled={
                  isProcessing ||
                  !password ||
                  password.length < 6 ||
                  !confirmPassword ||
                  password !== confirmPassword
                }
                className="w-full rounded-xl bg-gradient-to-r from-gray-600 to-gray-700 px-6 py-3.5 text-base font-semibold text-white shadow-sm hover:from-gray-700 hover:to-gray-800 disabled:opacity-50 disabled:cursor-not-allowed transition-all active:scale-[0.99]"
              >
                {isProcessing ? (
                  <span className="flex items-center justify-center gap-2">
                    <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                    {progress || "处理中..."}
                  </span>
                ) : (
                  <span className="flex items-center justify-center gap-2">
                    <Lock className="h-4 w-4" />
                    加密 PDF
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
