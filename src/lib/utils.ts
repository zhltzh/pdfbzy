import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * 格式化文件大小
 */
export function formatFileSize(bytes: number): string {
  if (bytes === 0) return "0 B";
  const k = 1024;
  const sizes = ["B", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + " " + sizes[i];
}

/**
 * 下载文件
 */
export function downloadFile(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  // 延迟释放，避免部分浏览器中断尚未开始的下载
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

/**
 * 生成唯一 ID
 */
export function generateId(): string {
  return Math.random().toString(36).substring(2, 11);
}

/**
 * 将底层库（pdf-lib/PDF.js/Ghostscript/Tesseract）抛出的英文错误
 * 映射为对用户友好的中文提示。
 */
export function friendlyError(err: unknown, fallback: string): string {
  const msg = err instanceof Error ? err.message : String(err ?? "");
  if (!msg) return fallback;

  const lower = msg.toLowerCase();

  // pdf-encrypt-lib 错误码
  if (msg.includes("WRONG_PASSWORD")) return "密码错误，无法解密该文件。请确认输入的密码正确。";
  if (msg.includes("NOT_ENCRYPTED")) return "该文件没有密码保护，无需解密。";
  if (msg.includes("XREF_STREAM_UNSUPPORTED"))
    return "该文件使用了较新的压缩结构（PDF 1.5+），浏览器端暂无法解密。建议使用桌面端软件处理。";
  if (msg.includes("CORRUPT_PDF")) return "文件已损坏或无法读取，请确认文件是有效的 PDF 格式。";
  if (msg.includes("INVALID_PASSWORD")) return "请输入密码后再尝试。";
  if (msg.includes("已加密")) return msg;

  // pdf-lib 常见错误
  if (msg.includes("encrypted") || msg.includes("password")) return "该 PDF 文件已加密，请先解密后再处理。";
  if (msg.includes("failed to parse") || msg.includes("is not a valid pdf") || msg.includes("corrupt"))
    return "文件无法解析，请确认是有效的 PDF 文件（且未被加密）。";
  if (msg.includes("object stream") || msg.includes("xref stream"))
    return "该 PDF 使用了较新的压缩结构，当前工具暂不支持。";

  // 网络/CDN/引擎类错误
  if (lower.includes("networkerror") || lower.includes("failed to fetch") || lower.includes("load failed"))
    return "网络请求失败，请检查网络连接后重试。";
  if (msg.includes("ABORT") || msg.includes("abort")) return "操作已中止。";
  if (lower.includes("wasm") || lower.includes("engine"))
    return "压缩引擎加载失败，请刷新页面重试。";
  if (lower.includes("worker")) return "后台处理进程加载失败，请刷新页面重试。";

  // OCR 语言包
  if (lower.includes("traineddata") || lower.includes("language")) return "识别语言包下载失败，请检查网络后重试。";

  // canvas 相关
  if (msg.includes("canvas")) return "当前浏览器不支持 Canvas，请更换浏览器后重试。";

  return msg;
}
