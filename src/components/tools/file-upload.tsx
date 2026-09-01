"use client";

import { useCallback, useState, useRef } from "react";
import {
  Upload,
  File,
  X,
  AlertCircle,
  CheckCircle2,
  FileWarning,
} from "lucide-react";
import { cn, formatFileSize } from "@/lib/utils";

type FileValidationError = {
  type: "type" | "size" | "count" | "empty";
  message: string;
};

interface FileUploadProps {
  onFilesSelected: (files: File[]) => void;
  multiple?: boolean;
  /** 接受的扩展名，如 ".pdf,.jpg" */
  accept?: string;
  /** 对应的可读描述，如 "PDF、JPG、PNG" */
  acceptDescription?: string;
  maxFiles?: number;
  maxSizeMB?: number;
  files: File[];
  onRemoveFile: (index: number) => void;
  onClear: () => void;
  /** 额外验证函数 */
  validate?: (file: File) => string | null;
}

export function FileUpload({
  onFilesSelected,
  multiple = true,
  accept = ".pdf",
  acceptDescription,
  maxFiles = 10,
  maxSizeMB = 50,
  files,
  onRemoveFile,
  onClear,
  validate,
}: FileUploadProps) {
  const [isDragOver, setIsDragOver] = useState(false);
  const [error, setError] = useState<FileValidationError | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const acceptDescriptionText =
    acceptDescription ||
    accept.split(",").map((a) => a.trim().replace(".", "").toUpperCase()).join("、");

  const clearError = useCallback(() => setError(null), []);

  const validateFiles = useCallback(
    (fileList: File[]): FileValidationError | null => {
      if (fileList.length === 0) {
        return { type: "empty", message: "没有选择任何文件" };
      }

      const acceptedExts = accept
        .split(",")
        .map((a) => a.trim().replace(".", "").toLowerCase());

      for (const file of fileList) {
        const ext = file.name.split(".").pop()?.toLowerCase() || "";

        // 检查文件类型
        if (!acceptedExts.includes(ext)) {
          return {
            type: "type",
            message: `"${file.name}" 不是支持的格式。请上传 ${acceptDescriptionText} 格式的文件。`,
          };
        }

        // 检查文件大小
        if (file.size > maxSizeMB * 1024 * 1024) {
          return {
            type: "size",
            message: `"${file.name}" 超过 ${maxSizeMB}MB 大小限制（当前 ${formatFileSize(file.size)}）`,
          };
        }

        // 检查空文件
        if (file.size === 0) {
          return {
            type: "empty",
            message: `"${file.name}" 是空文件，请检查后重试。`,
          };
        }

        // 自定义验证
        if (validate) {
          const customError = validate(file);
          if (customError) {
            return { type: "type", message: customError };
          }
        }
      }

      // 检查数量限制（单文件工具 maxFiles=1 时新选择视为替换，不拒绝）
      if (files.length + fileList.length > maxFiles && maxFiles !== 1) {
        return {
          type: "count",
          message: `最多只能上传 ${maxFiles} 个文件（已选 ${files.length} 个，新增 ${fileList.length} 个）`,
        };
      }

      return null;
    },
    [accept, acceptDescriptionText, maxFiles, maxSizeMB, files.length, validate]
  );

  const handleFiles = useCallback(
    (newFiles: FileList | File[]) => {
      clearError();
      const filesArray = Array.from(newFiles);

      const validationError = validateFiles(filesArray);
      if (validationError) {
        setError(validationError);
        return;
      }

      onFilesSelected(filesArray);
    },
    [clearError, validateFiles, onFilesSelected]
  );

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(true);
  }, []);

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
      if (e.dataTransfer.files.length > 0) {
        handleFiles(e.dataTransfer.files);
      }
    },
    [handleFiles]
  );

  const handleInputChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      if (e.target.files && e.target.files.length > 0) {
        handleFiles(e.target.files);
      }
      // 重置 input 以便重复选择同一文件
      e.target.value = "";
    },
    [handleFiles]
  );

  return (
    <div className="space-y-4">
      {/* 错误提示 */}
      {error && (
        <div className="flex items-start gap-3 rounded-xl border border-red-200 bg-red-50 px-4 py-3.5 animate-slide-up">
          <AlertCircle className="h-5 w-5 flex-shrink-0 text-red-500 mt-0.5" />
          <div className="flex-1">
            <p className="text-sm font-medium text-red-800">
              {error.type === "type"
                ? "文件格式错误"
                : error.type === "size"
                ? "文件太大"
                : error.type === "count"
                ? "文件数量超限"
                : "文件错误"}
            </p>
            <p className="mt-0.5 text-sm text-red-600">{error.message}</p>
          </div>
          <button
            onClick={clearError}
            className="flex-shrink-0 text-red-400 hover:text-red-600"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      )}

      {/* 上传区域 */}
      <div
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={() => inputRef.current?.click()}
        className={cn(
          "relative cursor-pointer rounded-2xl border-2 border-dashed p-10 transition-all duration-200",
          isDragOver
            ? "border-primary bg-primary/5 scale-[1.01]"
            : "border-gray-200 bg-white/50 hover:border-primary/50 hover:bg-gray-50/50",
          error && "border-red-200 bg-red-50/30"
        )}
      >
        <input
          ref={inputRef}
          type="file"
          accept={accept}
          multiple={multiple}
          className="hidden"
          onChange={handleInputChange}
        />
        <div className="flex flex-col items-center text-center">
          <div
            className={cn(
              "flex h-14 w-14 items-center justify-center rounded-2xl mb-4 transition-all",
              isDragOver
                ? "bg-primary/20 scale-110"
                : "bg-gray-100"
            )}
          >
            <Upload
              className={cn(
                "h-7 w-7 transition-colors",
                isDragOver ? "text-primary" : "text-gray-400"
              )}
            />
          </div>
          <p className="text-base font-medium text-gray-700">
            <span className="text-primary">点击选择文件</span>
            {" 或拖拽文件到此处"}
          </p>
          <p className="mt-1.5 text-sm text-gray-400">
            支持 {acceptDescriptionText} 格式
            {maxSizeMB < 100 && `，单文件最大 ${maxSizeMB}MB`}
          </p>
          {multiple && (
            <p className="mt-0.5 text-xs text-gray-300">
              最多 {maxFiles} 个文件
            </p>
          )}
        </div>
      </div>

      {/* 文件列表 */}
      {files.length > 0 && (
        <div className="rounded-xl border bg-white shadow-sm overflow-hidden animate-slide-up">
          <div className="flex items-center justify-between bg-gray-50 px-4 py-2.5 border-b">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4 text-green-500" />
              <span className="text-sm font-medium text-gray-700">
                已选择 {files.length} 个文件
              </span>
            </div>
            <button
              onClick={onClear}
              className="text-xs text-gray-400 hover:text-red-500 transition-colors px-2 py-1 rounded hover:bg-red-50"
            >
              清除全部
            </button>
          </div>
          <div className="divide-y max-h-60 overflow-y-auto">
            {files.map((file, index) => (
              <div
                key={`${file.name}-${file.size}-${index}`}
                className="flex items-center gap-3 px-4 py-3 hover:bg-gray-50/50 transition-colors group"
              >
                <File className="h-5 w-5 flex-shrink-0 text-primary" />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium text-gray-700 group-hover:text-gray-900">
                    {file.name}
                  </p>
                  <p className="text-xs text-gray-400">
                    {formatFileSize(file.size)}
                  </p>
                </div>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onRemoveFile(index);
                  }}
                  className="flex h-7 w-7 items-center justify-center rounded-full text-gray-300 hover:bg-red-50 hover:text-red-500 transition-all opacity-0 group-hover:opacity-100"
                  title="移除此文件"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
