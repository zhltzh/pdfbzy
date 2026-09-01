import type { Metadata } from "next";
import { getToolMetadata } from "@/config/seo";

export const metadata: Metadata = getToolMetadata("delete-pages");

export default function Layout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
