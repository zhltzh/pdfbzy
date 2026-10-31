import type { Metadata } from "next";
import "./globals.css";
import { Header } from "@/components/header";
import { Footer } from "@/components/footer";
import { BUILT_TOOL_COUNT } from "@/config/built-tools";

export const metadata: Metadata = {
  icons: {
    icon: "/favicon.png",
    shortcut: "/favicon.png",
    apple: "/favicon.png",
  },
  title: {
    default: `PDFBzy - 免费在线 PDF 工具 | ${BUILT_TOOL_COUNT}+ 种合并、拆分、转换、编辑 PDF 工具`,
    template: "%s - 免费在线 PDF 工具 | PDFBzy",
  },
  description:
    `PDFBzy 提供 ${BUILT_TOOL_COUNT}+ 种免费在线 PDF 工具，包括合并、拆分、压缩、转换、编辑、签名等功能。无需注册、无需上传服务器、浏览器本地处理，保护你的文档隐私。`,
  keywords: [
    "PDF工具", "在线PDF", "免费PDF", "PDF编辑", "PDF转换",
    "合并PDF", "拆分PDF", "压缩PDF", "PDF转Word", "图片转PDF",
    "PDF签名", "PDF解密", "PDF合并", "PDF拆分",
  ],
  authors: [{ name: "PDFBzy" }],
  creator: "PDFBzy",
  publisher: "PDFBzy",
  metadataBase: new URL("https://pdf.aixuno.com"),
  alternates: {
    canonical: "/",
  },
  openGraph: {
    title: "PDFBzy - 免费在线 PDF 工具",
    description:
      `${BUILT_TOOL_COUNT}+ 种免费在线 PDF 工具，合并、拆分、转换、编辑、签名，无需注册，浏览器本地处理，保护隐私。`,
    url: "https://pdf.aixuno.com",
    siteName: "PDFBzy",
    type: "website",
    locale: "zh_CN",
    images: [
      {
        url: "/og-image.png",
        width: 1200,
        height: 630,
        alt: "PDFBzy - 免费在线 PDF 工具",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "PDFBzy - 免费在线 PDF 工具",
    description:
      `${BUILT_TOOL_COUNT}+ 种免费在线 PDF 工具，合并、拆分、转换、编辑、签名，无需注册。`,
    images: ["/og-image.png"],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="zh-CN">
      <head>
        {/* 网站标识 JSON-LD */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@type": "WebSite",
              name: "PDFBzy",
              url: "https://pdf.aixuno.com",
              description: "免费在线 PDF 工具平台",
              potentialAction: {
                "@type": "SearchAction",
                target: {
                  "@type": "EntryPoint",
                  urlTemplate: "https://pdf.aixuno.com/search?q={search_term_string}",
                },
                "query-input": "required name=search_term_string",
              },
            }),
          }}
        />
        {/* 软件应用 JSON-LD */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@type": "SoftwareApplication",
              name: "PDFBzy",
              operatingSystem: "All",
              applicationCategory: "UtilitiesApplication",
              offers: {
                "@type": "Offer",
                price: "0",
                priceCurrency: "CNY",
              },
              description: `免费在线 PDF 工具平台，提供合并、拆分、转换、编辑、签名等 ${BUILT_TOOL_COUNT}+ 种 PDF 处理工具。`,
            }),
          }}
        />
      </head>
      <body className="font-sans antialiased">
        <div className="flex min-h-screen flex-col">
          <Header />
          <main className="flex-1">{children}</main>
          <Footer />
        </div>
      </body>
    </html>
  );
}
