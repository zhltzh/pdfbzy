import { MetadataRoute } from "next";
import { getToolBySlug } from "@/config/tools";
import { BUILT_TOOL_SLUGS } from "@/config/built-tools";
import { GUIDES, GUIDE_LIST_PATH } from "@/config/guides";

export default function sitemap(): MetadataRoute.Sitemap {
  const baseUrl = "https://pdf.aixuno.com";
  // 固定最后修改时间，保证静态导出的 sitemap 内容确定；内容变更时手动更新
  const lastModified = new Date("2026-11-01");

  // 静态页面
  const staticPages = [
    {
      url: baseUrl,
      lastModified,
      changeFrequency: "daily" as const,
      priority: 1.0,
    },
    {
      url: `${baseUrl}/tools`,
      lastModified,
      changeFrequency: "daily" as const,
      priority: 0.9,
    },
    {
      url: `${baseUrl}/about`,
      lastModified,
      changeFrequency: "monthly" as const,
      priority: 0.4,
    },
    {
      url: `${baseUrl}/privacy`,
      lastModified,
      changeFrequency: "monthly" as const,
      priority: 0.4,
    },
    {
      url: `${baseUrl}/terms`,
      lastModified,
      changeFrequency: "monthly" as const,
      priority: 0.3,
    },
    {
      url: `${baseUrl}/contact`,
      lastModified,
      changeFrequency: "monthly" as const,
      priority: 0.4,
    },
  ];

  // 工具页面（仅已实现的工具）
  const toolPages = BUILT_TOOL_SLUGS.map((slug) => {
    const tool = getToolBySlug(slug);
    return {
      url: `${baseUrl}/${slug}`,
      lastModified,
      changeFrequency: "weekly" as const,
      priority: tool?.category === "edit-read" ? 0.85 : 0.8,
    };
  });

  // 教程页面（列表 + 各篇文章，新增内容统一使用发布日期）
  const guidesLastModified = new Date("2026-11-23");
  const guidePages = [
    {
      url: `${baseUrl}${GUIDE_LIST_PATH}`,
      lastModified: guidesLastModified,
      changeFrequency: "weekly" as const,
      priority: 0.8,
    },
    ...GUIDES.map((guide) => ({
      url: `${baseUrl}/guides/${guide.slug}/`,
      lastModified: new Date(guide.dateModified),
      changeFrequency: "monthly" as const,
      priority: 0.7,
    })),
  ];

  return [...staticPages, ...toolPages, ...guidePages];
}
