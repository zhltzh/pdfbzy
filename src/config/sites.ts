export type AixunoSiteId = "markdown" | "image" | "compress" | "pdf" | "bg";

export type AixunoSite = {
  id: AixunoSiteId;
  href: string;
  label: string;
};

/** Shared Aixuno network. Links always point at the root path of each site. */
export const AIXUNO_SITES: AixunoSite[] = [
  { id: "markdown", href: "https://aixuno.com/", label: "Markdown 转换" },
  { id: "image", href: "https://image.aixuno.com/", label: "Pixkit 图片" },
  { id: "compress", href: "https://compress.aixuno.com/", label: "文件压缩" },
  { id: "pdf", href: "https://pdf.aixuno.com/", label: "PDF 工具" },
  { id: "bg", href: "https://bg.aixuno.com/", label: "AI 抠图" },
];

export const CURRENT_SITE: AixunoSiteId = "pdf";
