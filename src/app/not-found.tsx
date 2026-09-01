import Link from "next/link";
import { FileQuestion } from "lucide-react";

export default function NotFound() {
  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center px-4">
      <div className="flex h-20 w-20 items-center justify-center rounded-2xl bg-gray-100">
        <FileQuestion className="h-10 w-10 text-gray-400" />
      </div>
      <h1 className="mt-6 text-2xl font-bold text-gray-900">页面未找到</h1>
      <p className="mt-2 text-gray-500">
        你访问的页面不存在，或已被移除。
      </p>
      <Link
        href="/"
        className="mt-6 inline-flex items-center gap-2 rounded-xl bg-primary px-6 py-3 text-sm font-semibold text-white hover:bg-primary/90 transition-colors"
      >
        返回首页
      </Link>
    </div>
  );
}
