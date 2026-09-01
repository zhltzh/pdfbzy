import {
  Merge,
  Split,
  RotateCw,
  Trash2,
  ImagePlus,
  FileUp,
  FileDown,
  FileSignature,
  Lock,
  Unlock,
  ScanLine,
  Highlighter,
  PenTool,
  Crop,
  FileEdit,
  FileText,
  FileImage,
  FileSpreadsheet,
  Presentation,
  FileType,
  PanelRight,
  FileOutput,
  ListOrdered,
  Info,
  FilePlus2,
  Gauge,
  Stamp,
  Hash,
  type LucideIcon,
} from "lucide-react";

export interface ToolCategory {
  id: string;
  name: string;
  description: string;
}

export interface ToolDefinition {
  id: string;
  slug: string;
  name: string;
  shortName: string;
  description: string;
  metaDescription: string;
  icon: LucideIcon;
  category: string;
  color: string;
  isMultiFile: boolean;
  isClientSide: boolean;
  keywords: string[];
}

export const categories: ToolCategory[] = [
  {
    id: "edit-read",
    name: "编辑 & 阅读",
    description: "编辑、注释、阅读 PDF 文档",
  },
  {
    id: "convert-from",
    name: "将 PDF 转为其他格式",
    description: "将 PDF 转换为 Word、图片等格式",
  },
  {
    id: "convert-to",
    name: "其他格式转为 PDF",
    description: "将图片、Office 文档转换为 PDF",
  },
  {
    id: "other",
    name: "其他工具",
    description: "签名、旋转、页面管理等更多功能",
  },
];

export const tools: ToolDefinition[] = [
  // ===== 编辑 & 阅读 =====
  {
    id: "merge-pdf",
    slug: "merge-pdf",
    name: "合并 PDF",
    shortName: "合并",
    description: "将多个 PDF 文件合并为一个 PDF 文件",
    metaDescription:
      "在线免费合并 PDF 文件，将多个 PDF 合并为一个文档。无需上传服务器，浏览器本地处理，保护您的隐私。",
    icon: Merge,
    category: "edit-read",
    color: "from-blue-500 to-blue-600",
    isMultiFile: true,
    isClientSide: true,
    keywords: ["合并PDF", "PDF合并", "merge PDF", "combine PDF"],
  },
  {
    id: "split-pdf",
    slug: "split-pdf",
    name: "拆分 PDF",
    shortName: "拆分",
    description: "将 PDF 按页拆分为多个独立的 PDF 文件",
    metaDescription:
      "在线免费拆分 PDF 文件，将每一页拆分为独立的 PDF 文档。快速、安全、完全本地处理。",
    icon: Split,
    category: "edit-read",
    color: "from-purple-500 to-purple-600",
    isMultiFile: false,
    isClientSide: true,
    keywords: ["拆分PDF", "PDF拆分", "split PDF", "separate PDF pages"],
  },
  {
    id: "rotate-pdf",
    slug: "rotate-pdf",
    name: "旋转 PDF",
    shortName: "旋转",
    description: "旋转 PDF 页面方向，支持 90°/180°/270°",
    metaDescription:
      "在线免费旋转 PDF 页面，支持 90度、180度、270度旋转。无需上传，浏览器本地处理。",
    icon: RotateCw,
    category: "edit-read",
    color: "from-green-500 to-green-600",
    isMultiFile: false,
    isClientSide: true,
    keywords: ["旋转PDF", "PDF旋转", "rotate PDF"],
  },
  {
    id: "delete-pages",
    slug: "delete-pages",
    name: "删除 PDF 页面",
    shortName: "删页",
    description: "从 PDF 中删除不需要的页面",
    metaDescription:
      "在线免费删除 PDF 中的指定页面。快速删除不需要的页面，浏览器本地处理，保护隐私。",
    icon: Trash2,
    category: "edit-read",
    color: "from-red-500 to-red-600",
    isMultiFile: false,
    isClientSide: true,
    keywords: ["删除PDF页面", "PDF删页", "delete PDF pages", "remove PDF pages"],
  },
  {
    id: "extract-pages",
    slug: "extract-pages",
    name: "提取 PDF 页面",
    shortName: "提取",
    description: "从 PDF 中提取指定页面生成新文档",
    metaDescription:
      "在线免费提取 PDF 中的指定页面，将选中页面保存为新的 PDF 文件。精准、快速、安全。",
    icon: FileOutput,
    category: "edit-read",
    color: "from-cyan-500 to-cyan-600",
    isMultiFile: false,
    isClientSide: true,
    keywords: ["提取PDF页面", "PDF提取", "extract PDF pages"],
  },
  {
    id: "crop-pdf",
    slug: "crop-pdf",
    name: "裁剪 PDF",
    shortName: "裁剪",
    description: "裁剪 PDF 页面边缘，去除多余空白区域",
    metaDescription:
      "在线免费裁剪 PDF 页面，调整页面边距，去除不需要的空白区域。完全本地处理。",
    icon: Crop,
    category: "edit-read",
    color: "from-orange-500 to-orange-600",
    isMultiFile: false,
    isClientSide: true,
    keywords: ["裁剪PDF", "PDF裁剪", "crop PDF", "trim PDF"],
  },
  {
    id: "highlight-pdf",
    slug: "highlight-pdf",
    name: "高亮 PDF",
    shortName: "高亮",
    description: "高亮标记 PDF 中的重要内容",
    metaDescription:
      "在线免费高亮标记 PDF 文档中的重要内容。轻松标注重点段落，提高阅读效率。",
    icon: Highlighter,
    category: "edit-read",
    color: "from-yellow-500 to-yellow-600",
    isMultiFile: false,
    isClientSide: true,
    keywords: ["高亮PDF", "PDF高亮", "highlight PDF", "mark PDF"],
  },
  {
    id: "annotate-pdf",
    slug: "annotate-pdf",
    name: "PDF 注释",
    shortName: "注释",
    description: "为 PDF 添加注释、批注和标记",
    metaDescription:
      "在线免费为 PDF 文档添加注释和批注。支持高亮、下划线、便签、绘图等多种注释方式。",
    icon: PenTool,
    category: "edit-read",
    color: "from-pink-500 to-pink-600",
    isMultiFile: false,
    isClientSide: true,
    keywords: ["PDF注释", "PDF批注", "annotate PDF", "comment PDF"],
  },
  {
    id: "unlock-pdf",
    slug: "unlock-pdf",
    name: "解密 PDF",
    shortName: "解密",
    description: "移除 PDF 的密码保护，解锁文档",
    metaDescription:
      "在线免费移除 PDF 文件的密码保护。输入密码即可解锁受保护的 PDF 文档。",
    icon: Unlock,
    category: "edit-read",
    color: "from-teal-500 to-teal-600",
    isMultiFile: false,
    isClientSide: true,
    keywords: ["解密PDF", "PDF解密", "unlock PDF", "remove PDF password"],
  },
  {
    id: "reorder-pages",
    slug: "reorder-pages",
    name: "重排 PDF 页面",
    shortName: "重排",
    description: "调整 PDF 页面的排列顺序",
    metaDescription:
      "在线免费重排 PDF 页面顺序。可视化调整页面排列，拖拽排序，完全本地处理。",
    icon: ListOrdered,
    category: "edit-read",
    color: "from-violet-500 to-violet-600",
    isMultiFile: false,
    isClientSide: true,
    keywords: ["重排PDF页面", "PDF排序", "reorder PDF pages", "sort PDF"],
  },
  {
    id: "pdf-info",
    slug: "pdf-info",
    name: "PDF 文档信息",
    shortName: "文档信息",
    description: "查看 PDF 文件的详细属性信息",
    metaDescription:
      "在线免费查看 PDF 文档信息：页数、文件大小、作者、创建时间等元数据。浏览器本地读取，保护隐私。",
    icon: Info,
    category: "edit-read",
    color: "from-slate-500 to-slate-600",
    isMultiFile: false,
    isClientSide: true,
    keywords: ["PDF信息", "PDF属性", "PDF metadata", "PDF info"],
  },
  {
    id: "create-blank-pdf",
    slug: "create-blank-pdf",
    name: "创建空白 PDF",
    shortName: "空白PDF",
    description: "创建自定义尺寸和页数的空白 PDF",
    metaDescription:
      "在线免费创建空白 PDF 文件。自定义纸张尺寸（A4/A3/Letter等）、页数和方向，快速生成标准文档。",
    icon: FilePlus2,
    category: "other",
    color: "from-blue-500 to-blue-700",
    isMultiFile: false,
    isClientSide: true,
    keywords: ["创建空白PDF", "空白PDF", "create blank PDF", "new PDF"],
  },

  // ===== PDF 转其他格式 =====
  {
    id: "pdf-to-word",
    slug: "pdf-to-word",
    name: "PDF 转 Word",
    shortName: "PDF→Word",
    description: "将 PDF 转换为可编辑的 Word 文档",
    metaDescription:
      "在线免费将 PDF 转换为 Word 文档。高精度转换，保留原始排版和格式。",
    icon: FileText,
    category: "convert-from",
    color: "from-blue-600 to-blue-700",
    isMultiFile: false,
    isClientSide: false,
    keywords: ["PDF转Word", "PDF to Word", "convert PDF to Word"],
  },
  {
    id: "pdf-to-jpg",
    slug: "pdf-to-jpg",
    name: "PDF 转 JPG",
    shortName: "PDF→JPG",
    description: "将 PDF 页面转换为 JPG 图片",
    metaDescription:
      "在线免费将 PDF 文件的每一页转换为 JPG 图片。高质量输出，支持批量转换。",
    icon: FileImage,
    category: "convert-from",
    color: "from-green-600 to-green-700",
    isMultiFile: false,
    isClientSide: true,
    keywords: ["PDF转JPG", "PDF to JPG", "convert PDF to image"],
  },
  {
    id: "pdf-to-png",
    slug: "pdf-to-png",
    name: "PDF 转 PNG",
    shortName: "PDF→PNG",
    description: "将 PDF 页面转换为 PNG 图片",
    metaDescription:
      "在线免费将 PDF 文件的每一页转换为 PNG 图片。透明背景，高质量输出。",
    icon: FileImage,
    category: "convert-from",
    color: "from-green-600 to-green-700",
    isMultiFile: false,
    isClientSide: true,
    keywords: ["PDF转PNG", "PDF to PNG"],
  },
  {
    id: "pdf-to-excel",
    slug: "pdf-to-excel",
    name: "PDF 转 Excel",
    shortName: "PDF→Excel",
    description: "将 PDF 中的表格数据转换为 Excel",
    metaDescription:
      "在线免费将 PDF 转换为 Excel 文件。提取 PDF 中的表格数据到可编辑的电子表格。",
    icon: FileSpreadsheet,
    category: "convert-from",
    color: "from-emerald-600 to-emerald-700",
    isMultiFile: false,
    isClientSide: false,
    keywords: ["PDF转Excel", "PDF to Excel"],
  },
  {
    id: "pdf-to-ppt",
    slug: "pdf-to-ppt",
    name: "PDF 转 PPT",
    shortName: "PDF→PPT",
    description: "将 PDF 转换为 PowerPoint 演示文稿",
    metaDescription:
      "在线免费将 PDF 文件转换为 PowerPoint 演示文稿。保留原始内容和排版。",
    icon: Presentation,
    category: "convert-from",
    color: "from-red-600 to-red-700",
    isMultiFile: false,
    isClientSide: false,
    keywords: ["PDF转PPT", "PDF to PowerPoint"],
  },

  // ===== 其他格式转为 PDF =====
  {
    id: "jpg-to-pdf",
    slug: "jpg-to-pdf",
    name: "JPG 转 PDF",
    shortName: "JPG→PDF",
    description: "将 JPG 图片转换为 PDF 文档",
    metaDescription:
      "在线免费将 JPG 图片转换为 PDF 文件。支持多张图片合并为一个 PDF，完全本地处理。",
    icon: ImagePlus,
    category: "convert-to",
    color: "from-amber-500 to-amber-600",
    isMultiFile: true,
    isClientSide: true,
    keywords: ["JPG转PDF", "图片转PDF", "JPG to PDF", "image to PDF"],
  },
  {
    id: "png-to-pdf",
    slug: "png-to-pdf",
    name: "PNG 转 PDF",
    shortName: "PNG→PDF",
    description: "将 PNG 图片转换为 PDF 文档",
    metaDescription:
      "在线免费将 PNG 图片转换为 PDF 文件。支持多张图片合并，浏览器本地处理。",
    icon: ImagePlus,
    category: "convert-to",
    color: "from-amber-500 to-amber-600",
    isMultiFile: true,
    isClientSide: true,
    keywords: ["PNG转PDF", "PNG to PDF"],
  },
  {
    id: "image-to-pdf",
    slug: "image-to-pdf",
    name: "图片转 PDF",
    shortName: "图片→PDF",
    description: "将图片（JPG/PNG）转换为 PDF",
    metaDescription:
      "在线免费将 JPG 和 PNG 图片转换为 PDF 文件。支持批量上传多张图片合并为一个 PDF。",
    icon: ImagePlus,
    category: "convert-to",
    color: "from-amber-500 to-amber-600",
    isMultiFile: true,
    isClientSide: true,
    keywords: ["图片转PDF", "image to PDF"],
  },
  {
    id: "word-to-pdf",
    slug: "word-to-pdf",
    name: "Word 转 PDF",
    shortName: "Word→PDF",
    description: "将 Word 文档转换为 PDF 格式",
    metaDescription:
      "在线免费将 Word 文档转换为 PDF 文件。支持 .doc 和 .docx 格式。",
    icon: FileText,
    category: "convert-to",
    color: "from-blue-600 to-blue-700",
    isMultiFile: false,
    isClientSide: false,
    keywords: ["Word转PDF", "Word to PDF"],
  },
  {
    id: "excel-to-pdf",
    slug: "excel-to-pdf",
    name: "Excel 转 PDF",
    shortName: "Excel→PDF",
    description: "将 Excel 表格转换为 PDF 格式",
    metaDescription:
      "在线免费将 Excel 文件转换为 PDF 文档。支持 .xls 和 .xlsx 格式。",
    icon: FileSpreadsheet,
    category: "convert-to",
    color: "from-emerald-600 to-emerald-700",
    isMultiFile: false,
    isClientSide: false,
    keywords: ["Excel转PDF", "Excel to PDF"],
  },
  {
    id: "ppt-to-pdf",
    slug: "ppt-to-pdf",
    name: "PPT 转 PDF",
    shortName: "PPT→PDF",
    description: "将 PowerPoint 演示文稿转换为 PDF",
    metaDescription:
      "在线免费将 PowerPoint 文件转换为 PDF 格式。支持 .ppt 和 .pptx。",
    icon: Presentation,
    category: "convert-to",
    color: "from-red-600 to-red-700",
    isMultiFile: false,
    isClientSide: false,
    keywords: ["PPT转PDF", "PPT to PDF"],
  },

  // ===== 其他工具 =====
  {
    id: "sign-pdf",
    slug: "sign-pdf",
    name: "签署 PDF",
    shortName: "签名",
    description: "在 PDF 文档中添加电子签名",
    metaDescription:
      "在线免费为 PDF 添加电子签名。绘制、输入或上传签名，快速签署文档。",
    icon: FileSignature,
    category: "other",
    color: "from-indigo-500 to-indigo-600",
    isMultiFile: false,
    isClientSide: true,
    keywords: ["PDF签名", "签署PDF", "sign PDF", "electronic signature"],
  },
  {
    id: "protect-pdf",
    slug: "protect-pdf",
    name: "加密 PDF",
    shortName: "加密",
    description: "为 PDF 添加密码保护",
    metaDescription:
      "在线免费为 PDF 文件添加密码保护。设置打开密码，保护您的文档安全。",
    icon: Lock,
    category: "other",
    color: "from-gray-600 to-gray-700",
    isMultiFile: false,
    isClientSide: true,
    keywords: ["加密PDF", "PDF加密", "protect PDF", "password PDF"],
  },
  {
    id: "insert-pages",
    slug: "insert-pages",
    name: "插入 PDF 页面",
    shortName: "插页",
    description: "在 PDF 中插入空白页或其他文件页面",
    metaDescription:
      "在线免费在 PDF 文件中插入页面。可以插入空白页或从其他 PDF 导入页面。",
    icon: FileUp,
    category: "other",
    color: "from-violet-500 to-violet-600",
    isMultiFile: true,
    isClientSide: true,
    keywords: ["插入PDF页面", "PDF插页", "insert PDF pages"],
  },
  {
    id: "compress-pdf",
    slug: "compress-pdf",
    name: "压缩 PDF",
    shortName: "压缩",
    description: "压缩 PDF 文件大小，方便存储和分享",
    metaDescription:
      "在线免费压缩 PDF 文件，有效减小文件体积。基于 Ghostscript 专业压缩引擎，支持多档压缩强度，浏览器本地处理。",
    icon: Gauge,
    category: "other",
    color: "from-teal-500 to-teal-600",
    isMultiFile: false,
    isClientSide: true,
    keywords: ["压缩PDF", "PDF压缩", "compress PDF", "PDF optimizer", "减小PDF大小"],
  },
  {
    id: "ocr-text",
    slug: "ocr-text",
    name: "OCR 文字识别",
    shortName: "OCR",
    description: "识别图片和扫描版 PDF 中的文字，提取为可编辑文本",
    metaDescription:
      "在线免费 OCR 文字识别工具。识别图片和扫描版 PDF 中的文字，支持中英文，浏览器本地处理，一键提取可编辑文本。",
    icon: ScanLine,
    category: "other",
    color: "from-sky-500 to-sky-600",
    isMultiFile: false,
    isClientSide: true,
    keywords: ["OCR", "文字识别", "图片转文字", "扫描件识别", "OCR文字提取", "pdf ocr"],
  },
  {
    id: "watermark-pdf",
    slug: "watermark-pdf",
    name: "添加水印",
    shortName: "水印",
    description: "为 PDF 添加文字水印，保护文档版权和内容安全",
    metaDescription:
      "在线免费给 PDF 添加文字水印。支持中文水印、自定义透明度旋转角度、平铺或居中排版，浏览器本地处理，保护文档版权。",
    icon: Stamp,
    category: "edit-read",
    color: "from-rose-500 to-rose-600",
    isMultiFile: false,
    isClientSide: true,
    keywords: ["PDF水印", "添加水印", "文字水印", "watermark PDF", "文档水印", "版权保护"],
  },
  {
    id: "page-number",
    slug: "page-number",
    name: "添加页码",
    shortName: "页码",
    description: "为 PDF 添加页码、页眉页脚，支持多种格式和位置",
    metaDescription:
      "在线免费给 PDF 添加页码。支持页眉页脚、多种页码格式（纯数字/第X页/共X页）、自定义位置和字号，浏览器本地处理。",
    icon: Hash,
    category: "edit-read",
    color: "from-cyan-600 to-cyan-700",
    isMultiFile: false,
    isClientSide: true,
    keywords: ["PDF页码", "添加页码", "页眉页脚", "page number", "PDF 页脚", "文档页码"],
  },
  {
    id: "all-tools",
    slug: "tools",
    name: "所有工具",
    shortName: "全部",
    description: "查看 PDFBzy 所有 PDF 在线工具",
    metaDescription:
      "PDFBzy 提供全套免费 PDF 在线工具，包括合并、拆分、压缩、转换、编辑、签名等功能。全部免费使用。",
    icon: PanelRight,
    category: "other",
    color: "from-slate-500 to-slate-600",
    isMultiFile: false,
    isClientSide: true,
    keywords: ["PDF工具", "在线PDF", "free PDF tools"],
  },
];

export function getToolBySlug(slug: string): ToolDefinition | undefined {
  return tools.find((t) => t.slug === slug);
}

export function getToolsByCategory(categoryId: string): ToolDefinition[] {
  return tools.filter((t) => t.category === categoryId);
}

// 可用的工具（排除 "all-tools"）
export const availableTools = tools.filter((t) => t.id !== "all-tools");
