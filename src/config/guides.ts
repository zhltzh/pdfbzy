import type { Metadata } from "next";

/**
 * 教程（guides）元数据。
 * 正文在 src/app/guides/<slug>/page.tsx，这里只存列表、SEO、互链所需的信息。
 */
export interface GuideMeta {
  slug: string;
  /** 页面 H1 与 metadata title（不含站点后缀） */
  title: string;
  /** meta description，150 字以内 */
  description: string;
  /** 列表页卡片摘要 */
  summary: string;
  /** 对应站内工具 slug */
  toolSlug: string;
  toolName: string;
  /** 建议 3 个，必须存在于本列表，避免死链 */
  related: string[];
  datePublished: string;
  dateModified: string;
}

export const GUIDE_LIST_PATH = "/guides/";

const PUBLISHED = "2026-11-23";
const MODIFIED = "2026-11-23";

export const GUIDES: GuideMeta[] = [
  {
    slug: "compress-pdf-to-1mb",
    title: "PDF 怎么压缩到 1MB 以下？4 档压缩实测对比",
    description:
      "网申、邮件附件要求 PDF 小于 1MB？实测最大压缩、推荐压缩等 4 档强度，讲清扫描件和文字型 PDF 各能压多少，以及在浏览器本地免费压缩的方法。",
    summary:
      "从 4 档压缩强度讲到压不下去时的替代方案，扫描件、图片型 PDF 都能照着做。",
    toolSlug: "compress-pdf",
    toolName: "压缩 PDF",
    related: ["extract-pages-from-pdf", "merge-multiple-pdfs", "pdf-to-jpg-high-quality"],
    datePublished: PUBLISHED,
    dateModified: MODIFIED,
  },
  {
    slug: "extract-pages-from-pdf",
    title: "PDF 怎么提取某几页？只保留需要的页面",
    description:
      "只需要 PDF 里的某几页？用缩略图勾选即可提取指定页面，保持原始画质。本文对比提取页面、拆分、删除页面三种做法的适用场景，并给出操作步骤。",
    summary:
      "提取指定页面、逐页拆分、删除多余页面，三种需求对应三种做法，一张表讲清区别。",
    toolSlug: "extract-pages",
    toolName: "提取 PDF 页面",
    related: ["compress-pdf-to-1mb", "merge-multiple-pdfs", "add-page-numbers-to-pdf"],
    datePublished: PUBLISHED,
    dateModified: MODIFIED,
  },
  {
    slug: "scanned-pdf-to-text",
    title: "扫描件 PDF 怎么转成可编辑文字？OCR 识别教程",
    description:
      "扫描件 PDF 本质是图片，无法直接复制文字。本文教你用浏览器本地 OCR 把扫描 PDF 识别成可复制文本，并给出提高识别率的 5 个实用技巧。",
    summary:
      "扫描 PDF 文字提取不出来？从语言选择到扫描分辨率，一步步识别成可复制的文字。",
    toolSlug: "ocr-text",
    toolName: "OCR 文字识别",
    related: ["pdf-to-jpg-high-quality", "compress-pdf-to-1mb", "extract-pages-from-pdf"],
    datePublished: PUBLISHED,
    dateModified: MODIFIED,
  },
  {
    slug: "add-watermark-to-pdf",
    title: "PDF 怎么加水印？文字水印透明度与角度设置",
    description:
      "给 PDF 加「机密」「草稿」或公司名水印，防止文件被随意转发。本文说明水印文字、透明度、角度、字号和平铺/居中排版怎么选，并给出具体操作步骤。",
    summary:
      "透明度、旋转角度、字号、平铺还是居中，四个参数决定水印是否得体不碍阅读。",
    toolSlug: "watermark-pdf",
    toolName: "添加水印",
    related: ["add-page-numbers-to-pdf", "remove-pdf-password", "merge-multiple-pdfs"],
    datePublished: PUBLISHED,
    dateModified: MODIFIED,
  },
  {
    slug: "merge-multiple-pdfs",
    title: "多个 PDF 怎么合并成一个？顺序与大小注意事项",
    description:
      "把多份 PDF 合并成一份，顺序、页面尺寸、加密状态都会影响结果。本文给出合并步骤，并列出合并前必须检查的 4 件事，避免合并后返工。",
    summary:
      "合并顺序由上传顺序决定，页面尺寸、方向、加密、体积四项要先处理，三步完成合并。",
    toolSlug: "merge-pdf",
    toolName: "合并 PDF",
    related: ["extract-pages-from-pdf", "compress-pdf-to-1mb", "add-page-numbers-to-pdf"],
    datePublished: PUBLISHED,
    dateModified: MODIFIED,
  },
  {
    slug: "add-page-numbers-to-pdf",
    title: "PDF 怎么加页码？位置、格式、起始数字全解析",
    description:
      "论文、合同、标书都要加页码。本文讲清 6 种页码位置怎么选、3 种格式的差别、起始页码怎么设，以及封面不计入页码的处理办法。",
    summary:
      "底部居中还是外侧？纯数字还是「第 X 页 / 共 Y 页」？一篇文章选对页码设置。",
    toolSlug: "page-number",
    toolName: "添加页码",
    related: ["add-watermark-to-pdf", "merge-multiple-pdfs", "extract-pages-from-pdf"],
    datePublished: PUBLISHED,
    dateModified: MODIFIED,
  },
  {
    slug: "pdf-to-jpg-high-quality",
    title: "PDF 转 JPG 图片怎么保持清晰？分辨率选择实测",
    description:
      "PDF 转 JPG 后发糊，多半是倍率选低了。本文说明 1x、1.5x、2x 三档清晰度的差别、文件大小变化，以及什么场景该选哪一档，附操作步骤。",
    summary:
      "清晰度由原图分辨率和导出倍率共同决定，选错倍率再高的工具也救不回来。",
    toolSlug: "pdf-to-jpg",
    toolName: "PDF 转 JPG",
    related: ["scanned-pdf-to-text", "compress-pdf-to-1mb", "merge-multiple-pdfs"],
    datePublished: PUBLISHED,
    dateModified: MODIFIED,
  },
  {
    slug: "remove-pdf-password",
    title: "PDF 怎么删除密码和编辑限制？两种情况分别处理",
    description:
      "PDF 的「密码」有两种：打开密码和权限限制。本文说明什么情况下能直接移除限制、什么情况必须输入原密码，以及移除后如何重新加密。",
    summary:
      "能打开但改不了，和每次打开都要输密码，是两回事，处理方法完全不同。",
    toolSlug: "unlock-pdf",
    toolName: "解密 PDF",
    related: ["compress-pdf-to-1mb", "merge-multiple-pdfs", "add-watermark-to-pdf"],
    datePublished: PUBLISHED,
    dateModified: MODIFIED,
  },
];

export function getGuideBySlug(slug: string): GuideMeta | undefined {
  return GUIDES.find((g) => g.slug === slug);
}

export function getGuideMetadata(slug: string): Metadata {
  const guide = getGuideBySlug(slug);
  if (!guide) return {};

  const url = `https://pdf.aixuno.com/guides/${slug}/`;

  return {
    title: guide.title,
    description: guide.description,
    alternates: {
      canonical: url,
    },
    openGraph: {
      title: `${guide.title} - PDFBzy`,
      description: guide.description,
      url,
      siteName: "PDFBzy",
      type: "article",
      locale: "zh_CN",
      images: [
        {
          url: "/og-image.png",
          width: 1200,
          height: 630,
          alt: guide.title,
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title: `${guide.title} - PDFBzy`,
      description: guide.description,
      images: ["/og-image.png"],
    },
  };
}
