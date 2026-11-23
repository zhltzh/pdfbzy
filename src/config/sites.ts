export type AixunoSiteId = "markdown" | "image" | "compress" | "pdf" | "bg" | "scan" | "idphoto" | "restore" | "watermark";

export type AixunoSite = {
  id: AixunoSiteId;
  href: string;
  label: string;
};

/** Shared Aixuno network. Links always point at the root path of each site. */
export const AIXUNO_SITES: AixunoSite[] = [
  { id: "markdown", href: "https://aixuno.com/", label: "Markdown 转换" },
  { id: "image", href: "https://image.aixuno.com/", label: "Pixkit 图片批量处理" },
  { id: "compress", href: "https://compress.aixuno.com/", label: "文件压缩" },
  { id: "pdf", href: "https://pdf.aixuno.com/", label: "PDF 工具" },
  { id: "bg", href: "https://bg.aixuno.com/", label: "AI 抠图" },
  { id: "scan", href: "https://scan.aixuno.com/", label: "文档扫描" },
  { id: "idphoto", href: "https://idphoto.aixuno.com/", label: "证件照制作" },
  { id: "restore", href: "https://restore.aixuno.com/", label: "老照片修复" },
  { id: "watermark", href: "https://watermark.aixuno.com/", label: "视频去水印" },
];

export const CURRENT_SITE: AixunoSiteId = "pdf";
