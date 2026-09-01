/**
 * Next.js 支持 `?url` 后缀导入静态资源 URL。
 * 此声明为 pdfjs-dist worker 的 `?url` 导入提供类型支持。
 */
declare module "pdfjs-dist/build/pdf.worker.min.mjs?url" {
  const workerUrl: string;
  export default workerUrl;
}