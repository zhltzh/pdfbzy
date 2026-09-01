"use client";

import { useState, useCallback, useEffect, KeyboardEvent } from "react";
import { CheckSquare, Square, MinusSquare, ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";

interface PageSelectorProps {
  totalPages: number;
  selectedPages: Set<number>;
  onSelectionChange: (pages: Set<number>) => void;
  /** 单选模式（用于 Insert Pages 等） */
  singleSelect?: boolean;
  /** 显示全选/反选按钮 */
  showSelectAll?: boolean;
  /** 自定义标签 */
  label?: string;
  /** 是否禁用 */
  disabled?: boolean;
}

export function PageSelector({
  totalPages,
  selectedPages,
  onSelectionChange,
  singleSelect = false,
  showSelectAll = true,
  label,
  disabled = false,
}: PageSelectorProps) {
  const [focusedPage, setFocusedPage] = useState<number | null>(null);
  const [pageWidth, setPageWidth] = useState(56);

  // 计算每行显示多少页
  const pagesPerRow = Math.max(1, Math.floor((pageWidth > 0 ? 800 : 800) / 60));

  const handleTogglePage = useCallback(
    (pageNum: number) => {
      if (disabled) return;
      const next = new Set(selectedPages);
      if (singleSelect) {
        next.clear();
        next.add(pageNum);
      } else {
        if (next.has(pageNum)) {
          next.delete(pageNum);
        } else {
          next.add(pageNum);
        }
      }
      onSelectionChange(next);
    },
    [disabled, onSelectionChange, selectedPages, singleSelect]
  );

  const handleSelectAll = useCallback(() => {
    if (disabled) return;
    if (selectedPages.size === totalPages) {
      onSelectionChange(new Set());
    } else {
      onSelectionChange(new Set(Array.from({ length: totalPages }, (_, i) => i + 1)));
    }
  }, [disabled, onSelectionChange, selectedPages, totalPages]);

  const handleSelectNone = useCallback(() => {
    if (disabled) return;
    onSelectionChange(new Set());
  }, [disabled, onSelectionChange]);

  const handleSelectInverse = useCallback(() => {
    if (disabled) return;
    const next = new Set<number>();
    for (let i = 1; i <= totalPages; i++) {
      if (!selectedPages.has(i)) next.add(i);
    }
    onSelectionChange(next);
  }, [disabled, onSelectionChange, selectedPages, totalPages]);

  // 键盘导航
  const handleKeyDown = useCallback(
    (e: KeyboardEvent<HTMLButtonElement>, pageNum: number) => {
      if (disabled) return;
      let nextPage = pageNum;
      switch (e.key) {
        case "ArrowRight":
          e.preventDefault();
          nextPage = Math.min(pageNum + 1, totalPages);
          break;
        case "ArrowLeft":
          e.preventDefault();
          nextPage = Math.max(pageNum - 1, 1);
          break;
        case "ArrowDown":
          e.preventDefault();
          nextPage = Math.min(pageNum + pagesPerRow, totalPages);
          break;
        case "ArrowUp":
          e.preventDefault();
          nextPage = Math.max(pageNum - pagesPerRow, 1);
          break;
        case "Enter":
        case " ":
          e.preventDefault();
          handleTogglePage(pageNum);
          break;
        case "Home":
          e.preventDefault();
          nextPage = 1;
          break;
        case "End":
          e.preventDefault();
          nextPage = totalPages;
          break;
        default:
          return;
      }
      if (nextPage !== pageNum) {
        setFocusedPage(nextPage);
      }
    },
    [handleTogglePage, pagesPerRow, totalPages]
  );

  return (
    <div className="space-y-3" role="group" aria-label={label || "页面选择"}>
      {/* 标题栏 */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <label
            className={cn(
              "text-sm font-medium text-gray-700",
              disabled && "text-gray-400"
            )}
          >
            {label || "选择页面"}
          </label>
          <span className="text-xs text-gray-400">
            共 {totalPages} 页
          </span>
          <span className="text-xs font-medium text-primary bg-primary/10 px-2 py-0.5 rounded">
            已选 {selectedPages.size} 页
          </span>
        </div>

        {showSelectAll && !singleSelect && !disabled && (
          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={handleSelectAll}
              className="text-xs px-2 py-1 rounded hover:bg-gray-100 text-gray-600 transition-colors"
              aria-label="全选"
            >
              全选
            </button>
            <button
              type="button"
              onClick={handleSelectNone}
              className="text-xs px-2 py-1 rounded hover:bg-gray-100 text-gray-600 transition-colors"
              aria-label="取消全选"
            >
              取消
            </button>
            <button
              type="button"
              onClick={handleSelectInverse}
              className="text-xs px-2 py-1 rounded hover:bg-gray-100 text-gray-600 transition-colors"
              aria-label="反选"
            >
              反选
            </button>
          </div>
        )}
      </div>

      {/* 页面网格 */}
      <div
        className="flex flex-wrap gap-2 p-2 rounded-xl border bg-white"
        role="listbox"
        aria-label="页面列表"
        onMouseMove={(e) => {
          const rect = e.currentTarget.getBoundingClientRect();
          setPageWidth(rect.width);
        }}
      >
        {Array.from({ length: totalPages }, (_, i) => i + 1).map((pageNum) => {
          const isSelected = selectedPages.has(pageNum);
          const isFocused = focusedPage === pageNum;
          const isSingleSelected = singleSelect && isSelected;

          return (
            <button
              key={pageNum}
              type="button"
              onClick={() => handleTogglePage(pageNum)}
              onKeyDown={(e) => handleKeyDown(e, pageNum)}
              onFocus={() => setFocusedPage(pageNum)}
              onBlur={() => setFocusedPage(null)}
              disabled={disabled}
              tabIndex={isFocused || isSelected ? 0 : -1}
              role="option"
              aria-selected={isSelected}
              aria-label={`第 ${pageNum} 页${isSelected ? "，已选中" : ""}`}
              className={cn(
                "relative flex h-12 w-12 items-center justify-center rounded-lg text-sm font-medium transition-all active:scale-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2",
                isSingleSelected
                  ? "bg-primary text-white shadow-sm"
                  : isSelected
                  ? "bg-primary/10 text-primary border-2 border-primary"
                  : "bg-gray-50 text-gray-600 hover:bg-gray-100 border border-gray-200",
                disabled && "opacity-50 cursor-not-allowed"
              )}
            >
              {pageNum}
              {isSelected && !singleSelect && (
                <CheckSquare className="absolute -top-1 -right-1 h-4 w-4 text-primary" />
              )}
            </button>
          );
        })}
      </div>

      {/* 提示 */}
      {!singleSelect && selectedPages.size === 0 && !disabled && (
        <p className="text-xs text-gray-400 text-center py-2">
          点击选择页面，再次点击取消选择。支持键盘方向键导航，空格/回车切换选择。
        </p>
      )}
    </div>
  );
}