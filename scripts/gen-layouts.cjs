const fs = require("fs");
const path = require("path");

const dirs = [
  "create-blank-pdf", "crop-pdf", "delete-pages", "extract-pages",
  "image-to-pdf", "insert-pages", "jpg-to-pdf", "merge-pdf",
  "pdf-info", "pdf-to-jpg", "pdf-to-png", "png-to-pdf",
  "protect-pdf", "reorder-pages", "rotate-pdf", "sign-pdf",
  "split-pdf", "unlock-pdf",
];

const appDir = path.join(__dirname, "..", "src", "app");

for (const slug of dirs) {
  const layoutPath = path.join(appDir, slug, "layout.tsx");
  const content = `import type { Metadata } from "next";
import { getToolMetadata } from "@/config/seo";

export const metadata: Metadata = getToolMetadata("${slug}");

export default function Layout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
`;
  fs.writeFileSync(layoutPath, content, "utf8");
  console.log("created:", layoutPath);
}
console.log("DONE", dirs.length, "layouts");