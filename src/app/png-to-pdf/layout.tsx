import type { Metadata } from "next";
import { getToolMetadata } from "@/config/seo";

export const metadata: Metadata = getToolMetadata("png-to-pdf");

export default function Layout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
