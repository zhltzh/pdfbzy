import type { Metadata } from "next";
import { getToolBySlug } from "./tools";
import { getToolContent } from "./tool-content";

/**
 * 生成工具页面的完整 SEO Metadata（title/description/canonical/OG）
 */
export function getToolMetadata(slug: string): Metadata {
  const tool = getToolBySlug(slug);
  if (!tool) return {};

  const content = getToolContent(slug);
  const desc = content?.shortIntro || tool.metaDescription;

  return {
    title: tool.name,
    description: desc,
    alternates: {
      canonical: `https://pdf.aixuno.com/${slug}`,
    },
    openGraph: {
      title: `${tool.name} - 免费在线工具 | PDFBzy`,
      description: desc,
      url: `https://pdf.aixuno.com/${slug}`,
      siteName: "PDFBzy",
      type: "website",
      locale: "zh_CN",
      images: [
        {
          url: "/og-image.png",
          width: 1200,
          height: 630,
          alt: `PDFBzy ${tool.name} - 免费在线 PDF 工具`,
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title: `${tool.name} - 免费在线工具 | PDFBzy`,
      description: desc,
      images: ["/og-image.png"],
    },
  };
}