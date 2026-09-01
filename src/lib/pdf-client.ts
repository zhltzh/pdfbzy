import { PDFDocument, degrees, PDFImage } from "pdf-lib";
import { encryptPdf, decryptPdf } from "./vendor/pdf-encrypt-lib";

/**
 * 将 dataURL（data:image/png;base64,...）转为 Uint8Array
 */
function dataUrlToBytes(dataUrl: string): Uint8Array {
  const [, base64Data] = dataUrl.split(",");
  const binary = atob(base64Data);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes;
}

/**
 * 使用 Canvas 将文本渲染为 PNG dataURL。
 * 支持中文（使用系统字体）与旋转、透明度，解决 pdf-lib 标准字体不支持中文的问题。
 */
// 复用 canvas 元素，避免水印/页码每页重复创建（大文档性能优化）
let sharedCanvas: HTMLCanvasElement | null = null;

async function renderTextToDataUrl(
  text: string,
  opts: { fontSize: number; color: string; opacity: number; angleDeg: number }
): Promise<string> {
  const fontFamily =
    '"Microsoft YaHei", "PingFang SC", "Hiragino Sans GB", "SimHei", "Noto Sans CJK SC", "Arial", sans-serif';
  if (!sharedCanvas) {
    sharedCanvas = document.createElement("canvas");
  }
  const canvas = sharedCanvas;
  const probe = canvas.getContext("2d");
  if (!probe) throw new Error("当前浏览器不支持 Canvas，无法生成水印。");
  probe.font = `bold ${opts.fontSize}px ${fontFamily}`;
  const textWidth = probe.measureText(text).width;
  const textHeight = opts.fontSize * 1.3;

  const rad = (opts.angleDeg * Math.PI) / 180;
  const cos = Math.abs(Math.cos(rad));
  const sin = Math.abs(Math.sin(rad));
  const w = Math.ceil(textWidth * cos + textHeight * sin);
  const h = Math.ceil(textWidth * sin + textHeight * cos);
  canvas.width = w;
  canvas.height = h;

  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("当前浏览器不支持 Canvas，无法生成水印。");
  ctx.translate(w / 2, h / 2);
  ctx.rotate(rad);
  // 注意：此处不设置 globalAlpha，透明度由 drawImage 的 opacity 参数统一控制，
  // 避免双重施加导致实际透明度变为 opacity²
  ctx.font = `bold ${opts.fontSize}px ${fontFamily}`;
  ctx.fillStyle = opts.color;
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText(text, 0, 0);
  return canvas.toDataURL("image/png");
}

/**
 * 将 Uint8Array 转换为 ArrayBuffer（用于 Blob 构造）
 */
function toArrayBuffer(uint8: Uint8Array): ArrayBuffer {
  return uint8.buffer.slice(
    uint8.byteOffset,
    uint8.byteOffset + uint8.byteLength
  ) as ArrayBuffer;
}

/**
 * 加载 PDF，若文件加密（有打开密码）则抛出友好错误，
 * 避免后续 copyPages/save 生成损坏文件。
 */
async function loadPDF(buffer: ArrayBuffer): Promise<PDFDocument> {
  const pdf = await PDFDocument.load(buffer, { ignoreEncryption: true });
  if (pdf.isEncrypted) {
    throw new Error("该 PDF 文件已加密，请先使用「解密 PDF」工具移除密码保护后再处理。");
  }
  return pdf;
}

/**
 * 合并多个 PDF 文件
 */
export async function mergePDFs(fileBuffers: ArrayBuffer[]): Promise<ArrayBuffer> {
  const mergedPdf = await PDFDocument.create();

  for (const buffer of fileBuffers) {
    const pdf = await loadPDF(buffer);
    const indices = pdf.getPageIndices();
    const copiedPages = await mergedPdf.copyPages(pdf, indices);
    copiedPages.forEach((page) => mergedPdf.addPage(page));
  }

  const bytes = await mergedPdf.save();
  return toArrayBuffer(bytes);
}

/**
 * 拆分 PDF —— 每页一个独立 PDF
 */
export async function splitPDF(
  fileBuffer: ArrayBuffer,
  onProgress?: (current: number, total: number) => void
): Promise<{ pages: ArrayBuffer[]; totalPages: number }> {
  const pdf = await loadPDF(fileBuffer);
  const totalPages = pdf.getPageCount();
  const pages: ArrayBuffer[] = [];

  for (let i = 0; i < totalPages; i++) {
    const newPdf = await PDFDocument.create();
    const [copiedPage] = await newPdf.copyPages(pdf, [i]);
    newPdf.addPage(copiedPage);
    const bytes = await newPdf.save();
    pages.push(toArrayBuffer(bytes));
    onProgress?.(i + 1, totalPages);
  }

  return { pages, totalPages };
}

/**
 * 旋转 PDF 页面
 */
export async function rotatePDF(
  fileBuffer: ArrayBuffer,
  rotation: number, // 90, 180, 270
  pageNumbers?: number[] // 可选：指定页码，1-indexed
): Promise<ArrayBuffer> {
  const pdf = await loadPDF(fileBuffer);
  const pages = pdf.getPages();
  const totalPages = pages.length;

  const targetIndices = pageNumbers
    ? pageNumbers.filter((n) => n >= 1 && n <= totalPages).map((n) => n - 1)
    : Array.from({ length: totalPages }, (_, i) => i);

  for (const idx of targetIndices) {
    const current = pages[idx].getRotation().angle;
    // 源文件可能携带非 90° 倍数旋转，先四舍五入归一化再累加，避免 pdf-lib 抛错
    const currentRounded = Math.round(current / 90) * 90;
    pages[idx].setRotation(degrees(((currentRounded + rotation) % 360 + 360) % 360));
  }

  const bytes = await pdf.save();
  return toArrayBuffer(bytes);
}

/**
 * 删除 PDF 指定页面
 */
export async function deletePDFPages(
  fileBuffer: ArrayBuffer,
  pageNumbers: number[] // 1-indexed
): Promise<ArrayBuffer> {
  const pdf = await loadPDF(fileBuffer);
  const totalPages = pdf.getPageCount();

  // 按降序删除，避免索引变化
  const sortedPages = Array.from(new Set(pageNumbers))
    .filter((n) => n >= 1 && n <= totalPages)
    .sort((a, b) => b - a);

  for (const pageNum of sortedPages) {
    pdf.removePage(pageNum - 1);
  }

  const bytes = await pdf.save();
  return toArrayBuffer(bytes);
}

/**
 * 将图片（JPG/PNG）转换为 PDF
 */
export async function imagesToPDF(
  imageBuffers: {
    buffer: ArrayBuffer | Uint8Array;
    type: "jpg" | "jpeg" | "png" | "webp" | "bmp" | "gif";
  }[]
): Promise<ArrayBuffer> {
  const pdf = await PDFDocument.create();

  for (const img of imageBuffers) {
    const buf =
      img.buffer instanceof Uint8Array
        ? toArrayBuffer(img.buffer)
        : img.buffer;

    // 通过 createImageBitmap 解码，自动应用 JPEG EXIF 方向（手机竖拍照片方向修正）
    // 同时支持 WebP/BMP/GIF 等浏览器可解码的格式（统一重编码为 PNG 嵌入）
    let image: PDFImage;
    try {
      const mime =
        img.type === "png"
          ? "image/png"
          : img.type === "webp"
          ? "image/webp"
          : img.type === "bmp"
          ? "image/bmp"
          : img.type === "gif"
          ? "image/gif"
          : "image/jpeg";
      const bitmap = await createImageBitmap(
        new Blob([buf], { type: mime }),
        { imageOrientation: "from-image" }
      );
      // 重新编码为 PNG 嵌入（EXIF 已烘焙进像素）
      const canvas = document.createElement("canvas");
      canvas.width = bitmap.width;
      canvas.height = bitmap.height;
      const ctx = canvas.getContext("2d");
      if (!ctx) throw new Error("无法获取画布上下文");
      ctx.drawImage(bitmap, 0, 0);
      bitmap.close();
      const blob = await new Promise<Blob | null>((resolve) =>
        canvas.toBlob(resolve, "image/png")
      );
      if (!blob) throw new Error("图片解码失败");
      image = await pdf.embedPng(await blob.arrayBuffer());
    } catch {
      // 回退：直接嵌入原始字节
      if (img.type === "jpg" || img.type === "jpeg") {
        image = await pdf.embedJpg(buf);
      } else if (img.type === "png") {
        image = await pdf.embedPng(buf);
      } else {
        throw new Error("无法解码该图片格式，请转换为 JPG 或 PNG 后重试。");
      }
    }

    const page = pdf.addPage([image.width, image.height]);
    page.drawImage(image, {
      x: 0,
      y: 0,
      width: image.width,
      height: image.height,
    });
  }

  const bytes = await pdf.save();
  return toArrayBuffer(bytes);
}

/**
 * 提取 PDF 页面
 */
export async function extractPDFPages(
  fileBuffer: ArrayBuffer,
  pageNumbers: number[] // 1-indexed
): Promise<ArrayBuffer> {
  const pdf = await loadPDF(fileBuffer);
  const newPdf = await PDFDocument.create();
  const indices = pageNumbers
    .filter((n) => n >= 1 && n <= pdf.getPageCount())
    .map((n) => n - 1);
  const copiedPages = await newPdf.copyPages(pdf, indices);
  copiedPages.forEach((page) => newPdf.addPage(page));
  const bytes = await newPdf.save();
  return toArrayBuffer(bytes);
}

/**
 * 获取 PDF 页数
 */
export async function getPDFPageCount(fileBuffer: ArrayBuffer): Promise<number> {
  const pdf = await loadPDF(fileBuffer);
  return pdf.getPageCount();
}

/**
 * 获取 PDF 详细信息（元数据）
 */
export async function getPDFInfo(fileBuffer: ArrayBuffer): Promise<{
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
}> {
  const pdf = await loadPDF(fileBuffer);
  const pageCount = pdf.getPageCount();

  // pdf-lib 返回的元数据可能为 undefined
  const title = pdf.getTitle() || undefined;
  const author = pdf.getAuthor() || undefined;
  const subject = pdf.getSubject() || undefined;
  const keywords = pdf.getKeywords() || undefined;
  const creator = pdf.getCreator() || undefined;
  const producer = pdf.getProducer() || undefined;
  const creationDate = pdf.getCreationDate() || undefined;
  const modificationDate = pdf.getModificationDate() || undefined;

  // PDF 版本从文件头推断（简化处理）
  const header = new Uint8Array(fileBuffer.slice(0, 8));
  const headerStr = new TextDecoder().decode(header);
  const pdfVersionMatch = headerStr.match(/%PDF-(\d\.\d)/);
  const pdfVersion = pdfVersionMatch ? pdfVersionMatch[1] : "未知";

  return {
    pageCount,
    fileSize: fileBuffer.byteLength,
    title,
    author,
    subject,
    keywords,
    creator,
    producer,
    creationDate,
    modificationDate,
    pdfVersion,
  };
}

/**
 * 创建空白 PDF
 */
export async function createBlankPDF(options: {
  pageCount: number;
  width: number; // points (1 point = 1/72 inch)
  height: number;
}): Promise<ArrayBuffer> {
  const pdf = await PDFDocument.create();

  for (let i = 0; i < options.pageCount; i++) {
    pdf.addPage([options.width, options.height]);
  }

  const bytes = await pdf.save();
  return toArrayBuffer(bytes);
}

/**
 * 裁剪 PDF 页面
 */
export async function cropPDF(
  fileBuffer: ArrayBuffer,
  margins: {
    top: number;    // points
    bottom: number;
    left: number;
    right: number;
  },
  pageNumbers?: number[] // 可选：指定页码，1-indexed
): Promise<ArrayBuffer> {
  const pdf = await loadPDF(fileBuffer);
  const pages = pdf.getPages();
  const totalPages = pages.length;

  const targetIndices = pageNumbers
    ? pageNumbers.filter((n) => n >= 1 && n <= totalPages).map((n) => n - 1)
    : Array.from({ length: totalPages }, (_, i) => i);

  for (const idx of targetIndices) {
    const page = pages[idx];
    const { width, height } = page.getSize();

    // 校验裁剪框合法性：防止小幅面页面裁出负尺寸/损坏文件
    const cropLeft = Math.max(0, Math.min(margins.left, width - 1));
    const cropBottom = Math.max(0, Math.min(margins.bottom, height - 1));
    const cropRight = Math.min(width, Math.max(cropLeft + 1, width - margins.right));
    const cropTop = Math.min(height, Math.max(cropBottom + 1, height - margins.top));

    // 设置裁剪框
    page.setCropBox(cropLeft, cropBottom, cropRight, cropTop);
  }

  const bytes = await pdf.save();
  return toArrayBuffer(bytes);
}

/**
 * 重排 PDF 页面
 */
export async function reorderPDFPages(
  fileBuffer: ArrayBuffer,
  newOrder: number[] // 新顺序的页码数组（1-indexed），如 [3, 1, 2] 表示第3页移到第1位
): Promise<ArrayBuffer> {
  const pdf = await loadPDF(fileBuffer);
  const totalPages = pdf.getPageCount();

  // 验证 newOrder：必须恰好包含全部页码且无重复
  const validOrder = newOrder.filter((n) => n >= 1 && n <= totalPages);
  if (
    validOrder.length !== totalPages ||
    new Set(validOrder).size !== totalPages
  ) {
    throw new Error("页面顺序数组长度或页码无效（包含重复或缺失页码）");
  }

  const newPdf = await PDFDocument.create();
  const indices = validOrder.map((n) => n - 1);
  const copiedPages = await newPdf.copyPages(pdf, indices);
  copiedPages.forEach((page) => newPdf.addPage(page));

  const bytes = await newPdf.save();
  return toArrayBuffer(bytes);
}

/**
 * 插入 PDF 页面
 */
export async function insertPDFPages(
  mainFileBuffer: ArrayBuffer,
  insertOptions: {
    // 插入位置：在指定页码之后插入（0 表示文档开头，totalPages 表示文档结尾）
    position: number;
    // 插入内容：空白页配置 或 从其他 PDF 导入的页面
    type: "blank" | "fromFile";
    blankPages?: {
      count: number;
      width: number;
      height: number;
    };
    fromFileBuffer?: ArrayBuffer;
    fromFilePageNumbers?: number[]; // 1-indexed，要导入的页码
  }
): Promise<ArrayBuffer> {
  const mainPdf = await loadPDF(mainFileBuffer);
  const mainTotalPages = mainPdf.getPageCount();

  // 验证位置
  const position = Math.max(0, Math.min(insertOptions.position, mainTotalPages));

  const newPdf = await PDFDocument.create();

  // 复制 position 之前的页面
  const beforeIndices = Array.from({ length: position }, (_, i) => i);
  if (beforeIndices.length > 0) {
    const copied = await newPdf.copyPages(mainPdf, beforeIndices);
    copied.forEach((p) => newPdf.addPage(p));
  }

  // 插入新页面
  if (insertOptions.type === "blank") {
    const blankCount = insertOptions.blankPages?.count || 1;
    const blankWidth = insertOptions.blankPages?.width || 595.28;
    const blankHeight = insertOptions.blankPages?.height || 841.89;
    for (let i = 0; i < blankCount; i++) {
      newPdf.addPage([blankWidth, blankHeight]);
    }
  } else if (insertOptions.type === "fromFile" && insertOptions.fromFileBuffer) {
    const sourcePdf = await loadPDF(insertOptions.fromFileBuffer);
    // 未指定页码时导入全部页面；getPageIndices 返回 0 基索引，无需再做 1 基转换
    const sourceIndices = insertOptions.fromFilePageNumbers
      ? insertOptions.fromFilePageNumbers
          .filter((n) => n >= 1 && n <= sourcePdf.getPageCount())
          .map((n) => n - 1)
      : sourcePdf.getPageIndices();
    if (sourceIndices.length > 0) {
      const copied = await newPdf.copyPages(sourcePdf, sourceIndices);
      copied.forEach((p) => newPdf.addPage(p));
    }
  }

  // 复制 position 之后的页面
  const afterIndices = Array.from({ length: mainTotalPages - position }, (_, i) => position + i);
  if (afterIndices.length > 0) {
    const copied = await newPdf.copyPages(mainPdf, afterIndices);
    copied.forEach((p) => newPdf.addPage(p));
  }

  const bytes = await newPdf.save();
  return toArrayBuffer(bytes);
}

/**
 * 为 PDF 添加密码保护（加密）
 *
 * 使用 pdf-encrypt-lib（ISO 32000-2 R6 AES-256 标准安全处理器）。
 * 说明：pdf-lib 官方不支持加密，本实现基于 pdf-lib 对象模型 + node-forge。
 */
export async function protectPDF(
  fileBuffer: ArrayBuffer,
  password: string
): Promise<ArrayBuffer> {
  const encryptedBytes = await encryptPdf(fileBuffer, password);
  return toArrayBuffer(encryptedBytes);
}

/**
 * 移除 PDF 密码保护（解密）
 *
 * 使用 pdf-encrypt-lib（AES-256 R6，ISO 32000-2）。
 * 注意：pdf-lib 官方不支持加密/带密码加载，无法作为解密回退。
 * - NOT_ENCRYPTED：文件未加密，直接 load+save 移除可能的权限限制
 * - XREF_STREAM_UNSUPPORTED：PDF 1.5+ 压缩结构，浏览器端暂不支持，向上抛出
 * - WRONG_PASSWORD：密码错误，向上抛出
 */
export async function unprotectPDF(
  fileBuffer: ArrayBuffer,
  password: string
): Promise<ArrayBuffer> {
  try {
    const result = await decryptPdf(fileBuffer, password);
    return toArrayBuffer(result.bytes);
  } catch (err: any) {
    // NOT_ENCRYPTED：直接保存移除权限限制
    if (err?.message === "NOT_ENCRYPTED") {
      const pdf = await PDFDocument.load(fileBuffer, { ignoreEncryption: true });
      const bytes = await pdf.save();
      return toArrayBuffer(bytes);
    }
    throw err;
  }
}

/**
 * 检查 PDF 是否加密
 */
export async function checkPDFEncryption(fileBuffer: ArrayBuffer): Promise<{
  isEncrypted: boolean;
  hasUserPassword: boolean;
  hasOwnerPassword: boolean;
}> {
  try {
    // 尝试不带密码加载
    await PDFDocument.load(fileBuffer, { ignoreEncryption: false });
    return { isEncrypted: false, hasUserPassword: false, hasOwnerPassword: false };
  } catch (error: any) {
    if (error.message?.includes("password") || error.message?.includes("encrypted")) {
      return { isEncrypted: true, hasUserPassword: true, hasOwnerPassword: true };
    }
    throw error;
  }
}

/**
 * 在 PDF 指定页面嵌入签名图片
 *
 * @param fileBuffer 原始 PDF
 * @param signatureDataUrl 签名图片 dataURL（data:image/png;base64,...）
 * @param options 页面编号（1-indexed，默认最后一页）、位置（默认右下）、尺寸百分比
 */
export async function signPDF(
  fileBuffer: ArrayBuffer,
  signatureDataUrl: string,
  options: {
    pageNumber?: number;
    position?: "top-right" | "bottom-right" | "center" | "bottom-center";
    widthPercent?: number;
  } = {}
): Promise<ArrayBuffer> {
  const pdf = await loadPDF(fileBuffer);
  const pageCount = pdf.getPageCount();
  if (pageCount === 0) throw new Error("PDF 文件不包含任何页面");

  // 解析 dataURL → Uint8Array
  const [dataUrlHeader, base64Data] = signatureDataUrl.split(",");
  if (!base64Data) throw new Error("签名图片数据无效");
  const binary = atob(base64Data);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  // 根据 dataURL 的 MIME 类型选择嵌入方式（支持 PNG 与 JPG 签名图）
  const isJpeg = /^data:image\/(jpeg|jpg)/i.test(dataUrlHeader || "");
  const img = isJpeg ? await pdf.embedJpg(bytes) : await pdf.embedPng(bytes);

  const targetPage =
    typeof options.pageNumber === "number"
      ? Math.min(Math.max(1, options.pageNumber), pageCount) - 1
      : pageCount - 1;
  const page = pdf.getPage(targetPage);
  const { width: pageW, height: pageH } = page.getSize();

  // 签名宽度 = 页面宽度的百分比（默认 25%），高度按比例
  const widthPercent = options.widthPercent ?? 25;
  let sigW = (pageW * widthPercent) / 100;
  let sigH = (img.height / img.width) * sigW;
  // 高度钳制：签名过高时按页面高度重新缩放宽高，避免超出页面被裁掉
  if (sigH > pageH * 0.5) {
    sigH = pageH * 0.5;
    sigW = (img.width / img.height) * sigH;
  }
  const margin = Math.min(40, pageW * 0.05);

  const position = options.position ?? "bottom-right";
  let x = pageW - sigW - margin;
  let y = pageH - sigH - margin;
  if (position === "bottom-right") {
    x = pageW - sigW - margin;
    y = margin;
  } else if (position === "bottom-center") {
    x = (pageW - sigW) / 2;
    y = margin;
  } else if (position === "center") {
    x = (pageW - sigW) / 2;
    y = (pageH - sigH) / 2;
  } else {
    // top-right
    x = pageW - sigW - margin;
    y = pageH - sigH - margin;
  }

  page.drawImage(img, { x, y, width: sigW, height: sigH });
  const saved = await pdf.save();
  return toArrayBuffer(saved);
}

/**
 * 将 PDF 每页渲染为 JPG/PNG 图片（基于 PDF.js，浏览器本地渲染）
 *
 * @param fileBuffer 原始 PDF
 * @param format 输出格式 jpeg | png
 * @param scale 渲染倍率（1 = 原始尺寸，1.5 更清晰）
 */
export async function pdfToImages(
  fileBuffer: ArrayBuffer,
  format: "jpeg" | "png" = "jpeg",
  scale: number = 1.5,
  onProgress?: (current: number, total: number) => void,
  signal?: AbortSignal
): Promise<{ images: { blob: Blob; pageNumber: number }[]; totalPages: number }> {
  // 动态加载 PDF.js 避免污染其他工具页 bundle
  const pdfjs: any = await import("pdfjs-dist");
  if (!pdfjs.GlobalWorkerOptions?.workerSrc) {
    try {
      const worker = await import("pdfjs-dist/build/pdf.worker.min.mjs?url");
      pdfjs.GlobalWorkerOptions.workerSrc = worker.default;
    } catch {
      // 兜底：使用 CDN
      pdfjs.GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjs.version}/pdf.worker.min.mjs`;
    }
  }

  const doc = await pdfjs.getDocument({
    data: new Uint8Array(fileBuffer),
    isEvalSupported: false,
    disableFontFace: true,
  }).promise;
  const totalPages = doc.numPages;
  const images: { blob: Blob; pageNumber: number }[] = [];

  // 复用单个 canvas，避免每页分配大块内存
  const canvas = document.createElement("canvas");
  let currentWidth = 0;
  let currentHeight = 0;

  try {
    for (let i = 1; i <= totalPages; i++) {
      if (signal?.aborted) throw new Error("操作已取消");
      const page = await doc.getPage(i);
      try {
        const vp = page.getViewport({ scale });

        // 限制输出最大边长，避免超大页面
        const maxDim = Math.max(vp.width, vp.height);
        const finalScale = maxDim > 4096 ? scale * (4096 / maxDim) : scale;
        const viewport = finalScale === scale ? vp : page.getViewport({ scale: finalScale });

        const width = Math.floor(viewport.width);
        const height = Math.floor(viewport.height);
        if (width !== currentWidth || height !== currentHeight) {
          canvas.width = width;
          canvas.height = height;
          currentWidth = width;
          currentHeight = height;
        }
        const ctx = canvas.getContext("2d");
        if (!ctx) throw new Error("无法获取画布上下文");

        await page.render({ canvasContext: ctx, viewport }).promise;
        // 直接产出 Blob，避免 dataURL 字符串 + atob 二次拷贝放大内存
        const blob = await new Promise<Blob | null>((resolve) =>
          canvas.toBlob(resolve, format === "png" ? "image/png" : "image/jpeg", 0.92)
        );
        if (!blob) throw new Error("图片生成失败");
        images.push({ blob, pageNumber: i });
      } finally {
        // 释放 PDF.js 页面级资源
        page.cleanup();
      }
      onProgress?.(i, totalPages);
    }
  } finally {
    await doc.destroy();
  }

  return { images, totalPages };
}

/**
 * 压缩 PDF（基于 Ghostscript WASM，浏览器本地压缩）
 *
 * 通过 Web Worker 加载 Ghostscript 编译的 WebAssembly 引擎执行
 * 专业的 pdfwrite 压缩（重采样图片、子集化字体、重新编码流），
 * 压缩效果远超纯 JS 方案。
 *
 * @param fileBuffer 原始 PDF
 * @param preset 压缩强度：screen(最大压缩) / ebook(推荐) / printer / prepress(高质量)
 */
export async function compressPDF(
  fileBuffer: ArrayBuffer,
  preset: "screen" | "ebook" | "printer" | "prepress" = "ebook",
  signal?: AbortSignal
): Promise<ArrayBuffer> {
  if (typeof Worker === "undefined") {
    throw new Error("当前浏览器不支持 Web Worker，无法使用压缩功能。");
  }

  const VALID_PRESETS = ["screen", "ebook", "printer", "prepress"];
  const safePreset = VALID_PRESETS.includes(preset) ? preset : "ebook";

  return new Promise<ArrayBuffer>((resolve, reject) => {
    const worker = new Worker("/compress-worker.mjs", { type: "module" });
    let settled = false;
    let timeout: ReturnType<typeof setTimeout>;

    const finish = (fn: () => void) => {
      if (settled) return;
      clearTimeout(timeout);
      settled = true;
      worker.terminate();
      fn();
    };

    const handleMessage = (e: MessageEvent) => {
      const data = e.data;
      if (!data || data.id !== "compress") return;
      finish(() => {
        if (data.success) {
          resolve(new Uint8Array(data.output).buffer as ArrayBuffer);
        } else {
          reject(new Error(data.error || "压缩失败"));
        }
      });
    };

    const handleError = (e: ErrorEvent) => {
      finish(() => reject(new Error(e.message || "压缩引擎加载失败")));
    };

    const handleMessageError = () => {
      finish(() => reject(new Error("压缩引擎通信失败，请重试。")));
    };

    // 外部取消
    const handleAbort = () => {
      finish(() => reject(new Error("操作已取消")));
    };
    if (signal) {
      if (signal.aborted) {
        worker.terminate();
        reject(new Error("操作已取消"));
        return;
      }
      signal.addEventListener("abort", handleAbort, { once: true });
    }

    worker.addEventListener("message", handleMessage);
    worker.addEventListener("error", handleError);
    worker.addEventListener("messageerror", handleMessageError);

    // 超时保护：大文件长时间无响应时终止，避免页面无限等待
    timeout = setTimeout(() => {
      finish(() => reject(new Error("压缩超时，请尝试更小的文件或换用其他压缩档位。")));
    }, 5 * 60 * 1000);

    // 将 input 转移至 worker，避免复制大文件
    worker.postMessage(
      { id: "compress", input: fileBuffer, preset: safePreset },
      [fileBuffer]
    );
  });
}

/**
 * 为 PDF 添加文字水印（支持中文，通过 Canvas 渲染成图片嵌入）
 *
 * @param fileBuffer 原始 PDF
 * @param options 水印配置
 */
export async function addWatermark(
  fileBuffer: ArrayBuffer,
  options: {
    text?: string;
    opacity?: number;      // 透明度 0.05 ~ 1
    angleDeg?: number;     // 旋转角度 0-90，默认 45
    fontSize?: number;     // 字号 20-200，默认 60
    color?: string;        // 颜色，默认 #888888
    layout?: "tiled" | "centered"; // 平铺 / 居中，默认平铺
  } = {},
  onProgress?: (current: number, total: number) => void,
  signal?: AbortSignal
): Promise<ArrayBuffer> {
  if (!options.text || !options.text.trim()) {
    throw new Error("请输入水印文字内容。");
  }
  // 限制水印文字长度，避免超长文本导致 canvas 超限
  const trimmedText = options.text.trim();
  const maxLen = 80;
  const text = trimmedText.length > maxLen ? trimmedText.slice(0, maxLen) + "…" : trimmedText;

  const pdf = await loadPDF(fileBuffer);
  if (pdf.getPageCount() === 0) throw new Error("PDF 文件不包含任何页面");

  const opacity = options.opacity ?? 0.15;
  const angleDeg = options.angleDeg ?? 45;
  const fontSize = options.fontSize ?? 60;
  const color = options.color ?? "#888888";
  const layout = options.layout ?? "tiled";

  const dataUrl = await renderTextToDataUrl(text, { fontSize, color, opacity, angleDeg });
  const img = await pdf.embedPng(dataUrlToBytes(dataUrl));

  // pdf-lib 中 embedPng 返回尺寸单位为 pt（72dpi 下 1px = 1pt）
  const imgW = img.width;
  const imgH = img.height;

  const pages = pdf.getPages();
  for (let i = 0; i < pages.length; i++) {
    if (signal?.aborted) throw new Error("操作已取消");
    const page = pages[i];
    const { width: pageW, height: pageH } = page.getSize();

    if (layout === "centered") {
      // 居中：水印宽度约为页面宽度的一半
      const scale = (pageW * 0.6) / imgW;
      const w = imgW * scale;
      const h = imgH * scale;
      page.drawImage(img, {
        x: (pageW - w) / 2,
        y: (pageH - h) / 2,
        width: w,
        height: h,
        opacity,
      });
    } else {
      // 平铺：按单元格间距铺满整页
      const cellW = Math.max(imgW * 1.2, pageW / 2);
      const cellH = Math.max(imgH * 1.5, pageH / 2);
      const cols = Math.ceil(pageW / cellW) + 1;
      const rows = Math.ceil(pageH / cellH) + 1;
      const startX = (pageW - (cols - 1) * cellW) / 2;
      const startY = (pageH - (rows - 1) * cellH) / 2;

      for (let r = 0; r < rows; r++) {
        for (let c = 0; c < cols; c++) {
          const x = startX + c * cellW - imgW / 2;
          const y = startY + r * cellH - imgH / 2;
          page.drawImage(img, {
            x,
            y,
            width: imgW,
            height: imgH,
            opacity,
          });
        }
      }
    }
    onProgress?.(i + 1, pages.length);
  }

  const saved = await pdf.save();
  return toArrayBuffer(saved);
}

/**
 * 为 PDF 添加页码（支持页眉/页脚位置，中文格式）
 *
 * @param fileBuffer 原始 PDF
 * @param options 页码配置
 */
export async function addPageNumbers(
  fileBuffer: ArrayBuffer,
  options: {
    position?: "bottom-center" | "bottom-right" | "bottom-left" | "top-center" | "top-right" | "top-left";
    format?: "number" | "page-x" | "page-x-of-y";
    startNumber?: number;  // 起始页码，默认 1
    fontSize?: number;     // 字号 8-40，默认 12
    color?: string;        // 颜色，默认 #444444
  } = {},
  onProgress?: (current: number, total: number) => void,
  signal?: AbortSignal
): Promise<ArrayBuffer> {
  const pdf = await loadPDF(fileBuffer);
  const totalPages = pdf.getPageCount();
  if (totalPages === 0) throw new Error("PDF 文件不包含任何页面");

  const position = options.position ?? "bottom-center";
  const format = options.format ?? "number";
  const startNumber = options.startNumber ?? 1;
  const fontSize = options.fontSize ?? 12;
  const color = options.color ?? "#444444";

  for (let i = 0; i < totalPages; i++) {
    if (signal?.aborted) throw new Error("操作已取消");
    const pageNum = startNumber + i;
    let text: string;
    if (format === "page-x") {
      text = `第 ${pageNum} 页`;
    } else if (format === "page-x-of-y") {
      text = `第 ${pageNum} 页 / 共 ${totalPages} 页`;
    } else {
      text = String(pageNum);
    }

    const dataUrl = await renderTextToDataUrl(text, {
      fontSize,
      color,
      opacity: 1,
      angleDeg: 0,
    });
    const img = await pdf.embedPng(dataUrlToBytes(dataUrl));
    const imgW = img.width;
    const imgH = img.height;

    const page = pdf.getPage(i);
    const { width: pageW, height: pageH } = page.getSize();
    const margin = 24;

    let x: number, y: number;
    const isTop = position.startsWith("top");
    if (position.includes("left")) {
      x = margin;
    } else if (position.includes("right")) {
      x = pageW - imgW - margin;
    } else {
      x = (pageW - imgW) / 2;
    }
    y = isTop ? margin : pageH - imgH - margin;

    page.drawImage(img, { x, y, width: imgW, height: imgH, opacity: 1 });
    onProgress?.(i + 1, totalPages);
  }

  const saved = await pdf.save();
  return toArrayBuffer(saved);
}