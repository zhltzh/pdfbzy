/**
 * 已实现（有页面代码）的工具 slug 列表。
 * 用于 sitemap、导航等处，避免列出尚未开发的工具导致 404。
 *
 * 新增工具页面后，请在此追加对应 slug。
 */
export const BUILT_TOOL_SLUGS = [
  // 基础编辑
  "merge-pdf",
  "split-pdf",
  "rotate-pdf",
  "delete-pages",
  "extract-pages",
  "crop-pdf",
  "reorder-pages",
  "insert-pages",
  // 创建
  "create-blank-pdf",
  // 转换
  "jpg-to-pdf",
  "png-to-pdf",
  "image-to-pdf",
  "pdf-to-jpg",
  "pdf-to-png",
  // 安全
  "protect-pdf",
  "unlock-pdf",
  // 信息
  "pdf-info",
  // 其他
  "sign-pdf",
  "compress-pdf",
  "ocr-text",
  "watermark-pdf",
  "page-number",
] as const;

export type BuiltToolSlug = (typeof BUILT_TOOL_SLUGS)[number];

/** 已实现工具数量（构建时动态计算，供 SEO 文案使用） */
export const BUILT_TOOL_COUNT = BUILT_TOOL_SLUGS.length;