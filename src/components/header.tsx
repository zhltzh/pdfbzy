"use client";

import Link from "next/link";
import { useState } from "react";
import { Menu, X, FileText, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";
import { categories, availableTools } from "@/config/tools";
import { BUILT_TOOL_SLUGS } from "@/config/built-tools";

// 只展示已实现（有页面）的工具，避免导航到 404
const builtTools = availableTools.filter(
  (t) => BUILT_TOOL_SLUGS.includes(t.slug as (typeof BUILT_TOOL_SLUGS)[number])
);

export function Header() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-white/95 backdrop-blur supports-[backdrop-filter]:bg-white/60">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 items-center justify-between">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary text-white">
              <FileText className="h-5 w-5" />
            </div>
            <span className="text-xl font-bold text-gray-900">
              PDF<span className="text-primary">Bzy</span>
            </span>
          </Link>

          {/* Desktop Nav */}
          <nav className="hidden md:flex md:items-center md:gap-1">
            {categories.map((cat) => {
              const catTools = builtTools.filter(
                (t) => t.category === cat.id
              );
              return (
                <div key={cat.id} className="relative group">
                  <Link
                    href={`/tools#${cat.id}`}
                    className="inline-flex items-center px-3 py-2 text-sm font-medium text-gray-600 hover:text-primary rounded-md hover:bg-gray-50 transition-colors"
                  >
                    {cat.name}
                  </Link>
                  <div className="absolute left-0 top-full z-50 hidden group-hover:block pt-2">
                    <div className="w-64 rounded-lg border bg-white p-2 shadow-lg">
                      {catTools.slice(0, 6).map((tool) => (
                        <Link
                          key={tool.id}
                          href={`/${tool.slug}`}
                          className="flex items-center gap-2 rounded-md px-3 py-2 text-sm text-gray-600 hover:bg-gray-50 hover:text-primary transition-colors"
                        >
                          <tool.icon className="h-4 w-4" />
                          {tool.name}
                        </Link>
                      ))}
                      {catTools.length > 6 && (
                        <Link
                          href={`/tools#${cat.id}`}
                          className="mt-1 flex items-center gap-2 rounded-md border-t border-gray-100 px-3 py-2 text-sm font-medium text-primary hover:bg-gray-50 transition-colors"
                        >
                          查看全部 {catTools.length} 个工具
                          <ChevronRight className="h-3.5 w-3.5" />
                        </Link>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
            <Link
              href="/tools"
              className="inline-flex items-center px-3 py-2 text-sm font-medium text-gray-600 hover:text-primary rounded-md hover:bg-gray-50 transition-colors"
            >
              所有工具
            </Link>
          </nav>

          {/* Mobile Menu Button */}
          <button
            onClick={() => setIsMenuOpen(!isMenuOpen)}
            className="inline-flex items-center justify-center rounded-md p-2 text-gray-600 hover:bg-gray-100 md:hidden"
          >
            {isMenuOpen ? (
              <X className="h-6 w-6" />
            ) : (
              <Menu className="h-6 w-6" />
            )}
          </button>
        </div>
      </div>

      {/* Mobile Menu */}
      <div
        className={cn(
          "md:hidden border-t overflow-hidden transition-all duration-200",
          isMenuOpen ? "max-h-screen" : "max-h-0"
        )}
      >
        <div className="space-y-1 px-4 py-3">
          {categories.map((cat) => {
            const catTools = builtTools.filter(
              (t) => t.category === cat.id
            );
            if (catTools.length === 0) return null;
            return (
              <div key={cat.id}>
                <Link
                  href={`/tools#${cat.id}`}
                  className="block px-3 py-2 text-sm font-medium text-gray-700 hover:text-primary"
                  onClick={() => setIsMenuOpen(false)}
                >
                  {cat.name}
                </Link>
                <div className="pl-4 space-y-0.5">
                  {catTools.map((tool) => (
                    <Link
                      key={tool.id}
                      href={`/${tool.slug}`}
                      className="flex items-center gap-2 px-3 py-1.5 text-sm text-gray-500 hover:text-primary"
                      onClick={() => setIsMenuOpen(false)}
                    >
                      <tool.icon className="h-3.5 w-3.5" />
                      {tool.name}
                    </Link>
                  ))}
                </div>
              </div>
            );
          })}
          <Link
            href="/tools"
            className="block px-3 py-2 text-sm font-medium text-primary"
            onClick={() => setIsMenuOpen(false)}
          >
            所有工具 →
          </Link>
        </div>
      </div>
    </header>
  );
}
