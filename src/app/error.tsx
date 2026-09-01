"use client";

import { useEffect } from "react";
import { AlertTriangle, RefreshCw } from "lucide-react";

export default function ErrorPage({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // 记录错误信息便于排查（生产环境不会暴露给用户）
    console.error("页面渲染错误:", error);
  }, [error]);

  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center px-4">
      <div className="flex h-20 w-20 items-center justify-center rounded-2xl bg-red-50">
        <AlertTriangle className="h-10 w-10 text-red-400" />
      </div>
      <h1 className="mt-6 text-2xl font-bold text-gray-900">出错了</h1>
      <p className="mt-2 text-gray-500">
        页面加载时遇到了问题，请刷新重试。
      </p>
      <button
        onClick={reset}
        className="mt-6 inline-flex items-center gap-2 rounded-xl bg-primary px-6 py-3 text-sm font-semibold text-white hover:bg-primary/90 transition-colors"
      >
        <RefreshCw className="h-4 w-4" />
        刷新页面
      </button>
    </div>
  );
}
