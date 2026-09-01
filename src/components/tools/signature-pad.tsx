"use client";

import { useRef, useState, useCallback, useEffect } from "react";
import { Trash2, RotateCcw, Check } from "lucide-react";
import { cn } from "@/lib/utils";

interface SignaturePadProps {
  /** 签名数据 URL (data:image/png;base64,...) */
  value?: string;
  /** 签名变化回调 */
  onChange: (dataUrl: string | null) => void;
  /** 画布宽度（数字为像素，字符串为 CSS 值） */
  width?: number | string;
  /** 画布高度 */
  height?: number;
  /** 笔触颜色 */
  penColor?: string;
  /** 笔触粗细 */
  penWidth?: number;
  /** 背景颜色 */
  backgroundColor?: string;
  /** 是否禁用 */
  disabled?: boolean;
  /** 占位符文本 */
  placeholder?: string;
}

export function SignaturePad({
  value,
  onChange,
  width = "100%",
  height = 200,
  penColor = "#1f2937",
  penWidth = 2,
  backgroundColor = "#ffffff",
  disabled = false,
  placeholder = "在此处签名...",
}: SignaturePadProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [hasSignature, setHasSignature] = useState(false);
  const contextRef = useRef<CanvasRenderingContext2D | null>(null);
  // 保存绘制参数，供事件回调读取
  const penRef = useRef({ penColor, penWidth, backgroundColor, placeholder, disabled });
  // 撤销栈：每完成一笔保存快照
  const undoStackRef = useRef<string[]>([]);

  useEffect(() => {
    penRef.current = { penColor, penWidth, backgroundColor, placeholder, disabled };
  }, [penColor, penWidth, backgroundColor, placeholder, disabled]);

  // 初始化 Canvas
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    contextRef.current = ctx;

    // 设置高分辨率（布局未就绪时用 props 高度兜底，避免画成 1px）
    const dpr = window.devicePixelRatio || 1;
    const rect = canvas.getBoundingClientRect();
    const cssWidth = rect.width > 0 ? rect.width : (typeof width === "number" ? width : 600);
    const cssHeight = rect.height > 0 ? rect.height : height;
    canvas.width = Math.max(1, cssWidth * dpr);
    canvas.height = Math.max(1, cssHeight * dpr);
    ctx.scale(dpr, dpr);
    canvas.style.width = `${cssWidth}px`;
    canvas.style.height = `${cssHeight}px`;

    // 背景
    ctx.fillStyle = backgroundColor;
    ctx.fillRect(0, 0, cssWidth, cssHeight);

    // 占位符文本
    if (placeholder) {
      ctx.font = "14px system-ui, sans-serif";
      ctx.fillStyle = "#9ca3af";
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText(placeholder, cssWidth / 2, cssHeight / 2);
    }

    // 如果有初始值，绘制
    if (value) {
      const img = new Image();
      img.onload = () => {
        ctx.drawImage(img, 0, 0, cssWidth, cssHeight);
        setHasSignature(true);
      };
      img.src = value;
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // 获取触点位置（原生事件）
  const getPoint = useCallback((e: MouseEvent | TouchEvent) => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };
    const rect = canvas.getBoundingClientRect();
    const clientX = "touches" in e ? e.touches[0]?.clientX ?? 0 : e.clientX;
    const clientY = "touches" in e ? e.touches[0]?.clientY ?? 0 : e.clientY;
    return {
      x: clientX - rect.left,
      y: clientY - rect.top,
    };
  }, []);

  // 开始绘制（原生事件，直接作为 EventListener）
  const startDrawing = useCallback(
    (e: Event) => {
      if (penRef.current.disabled) return;
      e.preventDefault();
      const ctx = contextRef.current;
      if (!ctx) return;

      setIsDrawing(true);
      const point = getPoint(e as MouseEvent | TouchEvent);
      ctx.beginPath();
      ctx.moveTo(point.x, point.y);
      ctx.lineCap = "round";
      ctx.lineJoin = "round";
      ctx.strokeStyle = penRef.current.penColor;
      ctx.lineWidth = penRef.current.penWidth;
    },
    [getPoint]
  );

  // 绘制中
  const draw = useCallback(
    (e: Event) => {
      if (!isDrawing || penRef.current.disabled) return;
      e.preventDefault();
      const ctx = contextRef.current;
      if (!ctx) return;

      const point = getPoint(e as MouseEvent | TouchEvent);
      ctx.lineTo(point.x, point.y);
      ctx.stroke();
      setHasSignature(true);
    },
    [getPoint, isDrawing]
  );

  // 结束绘制
  const stopDrawing = useCallback(() => {
    if (!isDrawing) return;
    setIsDrawing(false);
    const canvas = canvasRef.current;
    if (canvas) {
      onChange(canvas.toDataURL("image/png"));
      // 保存快照用于撤销
      undoStackRef.current.push(canvas.toDataURL("image/png"));
    }
  }, [isDrawing, onChange]);

  // 清除签名
  const handleClear = useCallback(() => {
    const canvas = canvasRef.current;
    const ctx = contextRef.current;
    if (!canvas || !ctx) return;

    const { backgroundColor: bg, placeholder: ph } = penRef.current;
    ctx.fillStyle = bg;
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    if (ph) {
      ctx.font = "14px system-ui, sans-serif";
      ctx.fillStyle = "#9ca3af";
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText(ph, canvas.width / 2, canvas.height / 2);
    }

    setHasSignature(false);
    onChange(null);
    undoStackRef.current = [];
  }, [onChange]);

  // 撤销：回退到上一笔
  const handleUndo = useCallback(() => {
    const canvas = canvasRef.current;
    const ctx = contextRef.current;
    if (!canvas || !ctx) return;
    const prev = undoStackRef.current.pop();
    if (!prev) {
      handleClear();
      return;
    }
    const img = new Image();
    img.onload = () => {
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
      setHasSignature(true);
      onChange(prev);
    };
    img.src = prev;
  }, [handleClear, onChange]);

  // 绑定鼠标/触摸事件
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    canvas.addEventListener("mousedown", startDrawing);
    window.addEventListener("mousemove", draw);
    window.addEventListener("mouseup", stopDrawing);
    canvas.addEventListener("touchstart", startDrawing, { passive: false });
    window.addEventListener("touchmove", draw, { passive: false });
    window.addEventListener("touchend", stopDrawing);

    return () => {
      canvas.removeEventListener("mousedown", startDrawing);
      window.removeEventListener("mousemove", draw);
      window.removeEventListener("mouseup", stopDrawing);
      canvas.removeEventListener("touchstart", startDrawing);
      window.removeEventListener("touchmove", draw);
      window.removeEventListener("touchend", stopDrawing);
    };
  }, [startDrawing, draw, stopDrawing]);

  return (
    <div className="space-y-3">
      {/* 签名画布 */}
      <div className="relative rounded-xl border bg-white overflow-hidden">
        <canvas
          ref={canvasRef}
          style={{
            width: typeof width === "number" ? `${width}px` : width,
            height: typeof height === "number" ? `${height}px` : height,
            cursor: disabled ? "not-allowed" : "crosshair",
            touchAction: "none",
          }}
          className={cn(
            "w-full block",
            disabled && "opacity-50 cursor-not-allowed"
          )}
          role="img"
          aria-label={hasSignature ? "已绘制签名" : "空白签名区域"}
        />
        {!hasSignature && !disabled && (
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <p className="text-gray-300 text-sm">{placeholder}</p>
          </div>
        )}
      </div>

      {/* 工具栏 */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <span
            className={cn(
              "text-sm",
              hasSignature ? "text-green-600" : "text-gray-400"
            )}
          >
            {hasSignature ? (
              <>
                <Check className="inline h-3.5 w-3.5 mr-1" />
                已绘制签名
              </>
            ) : (
              "未绘制签名"
            )}
          </span>
        </div>

        <div className="flex items-center gap-2">
          {!disabled && (
            <>
              <button
                type="button"
                onClick={handleUndo}
                disabled={!hasSignature}
                className={cn(
                  "inline-flex items-center gap-1.5 px-3 py-1.5 text-sm rounded-lg border transition-colors",
                  hasSignature
                    ? "border-gray-300 text-gray-600 hover:bg-gray-50"
                    : "border-gray-200 text-gray-400 cursor-not-allowed"
                )}
                aria-label="撤销/重新签名"
              >
                <RotateCcw className="h-4 w-4" />
                重签
              </button>
              <button
                type="button"
                onClick={handleClear}
                disabled={!hasSignature}
                className={cn(
                  "inline-flex items-center gap-1.5 px-3 py-1.5 text-sm rounded-lg border transition-colors",
                  hasSignature
                    ? "border-red-300 text-red-600 hover:bg-red-50"
                    : "border-gray-200 text-gray-400 cursor-not-allowed"
                )}
                aria-label="清除签名"
              >
                <Trash2 className="h-4 w-4" />
                清除
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
