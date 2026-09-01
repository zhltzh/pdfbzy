# PDFBzy - 免费在线 PDF 工具箱

免费在线 PDF 处理工具集，22 个工具全部在浏览器本地完成，文件不上传服务器。

## 功能列表

- **编辑**：合并、拆分、旋转、删除页、提取页、裁剪、重排、插入页
- **转换**：PDF→JPG/PNG、JPG/PNG/图片→PDF
- **安全**：加密（AES-256）、解密
- **其他**：签名、压缩、OCR 文字识别、水印、页码、PDF 信息、空白 PDF

## 技术栈

- Next.js 14 (App Router) + React 18 + TypeScript + Tailwind CSS
- pdf-lib、PDF.js、Ghostscript WASM（压缩）、Tesseract.js（OCR）
- 全部处理在浏览器本地完成，无后端、无上传

## 开发

```bash
npm install
npm run dev        # http://localhost:3000
npm run build      # 生产构建
npm start          # 生产服务器
npm run test:e2e   # 端到端测试（自动启动服务器 + 运行 18 项测试）
```

## 部署说明（重要）

压缩（Ghostscript）和 OCR（Tesseract）依赖浏览器端 WASM 运行库，体积约 42MB，未纳入 git。

部署前需要将以下文件放置到 `public/vendor/` 目录：

```
public/vendor/ghostscript/gs.js
public/vendor/ghostscript/gs.wasm
public/vendor/tesseract/worker.min.js
public/vendor/tesseract/tesseract-core-*.wasm(.js)
```

这些文件可以从 `node_modules/@okathira/ghostpdl-wasm` 和 `node_modules/tesseract.js` 中复制：

```bash
# 在项目目录执行
npm run setup:vendor
```

> 没有这些文件时，除压缩和 OCR 外的其余 20 个工具仍可正常使用。

## 添加新工具

1. 在 `src/app/` 下创建 `slug/page.tsx`（参考现有工具页面）
2. 在 `src/config/tools.ts` 注册工具定义
3. 在 `src/config/built-tools.ts` 的 `BUILT_TOOL_SLUGS` 加入 slug（导航/SEO 自动跟随）
4. 可选：在 `src/config/tool-content.ts` 补充 SEO 文案
