import type { Metadata } from "next";
import { getGuideBySlug, getGuideMetadata } from "@/config/guides";
import { GuideArticle, GuideToolCta } from "@/components/guides/guide-article";

export const metadata: Metadata = getGuideMetadata("pdf-to-jpg-high-quality");
const guide = getGuideBySlug("pdf-to-jpg-high-quality")!;

const faq = [
  {
    q: "一次能转多少页？",
    a: "文件数量最多 10 个、单个 50MB；页数没有单独限制。页数越多处理越慢，输出文件也越多，建议先提取需要的页面再转换。",
  },
  {
    q: "转出来的 JPG 是黑白的吗？",
    a: "不是，默认保持原页面颜色。如果扫描件本身是灰度或黑白，输出也会保持原样。",
  },
  {
    q: "能只转其中几页吗？",
    a: "当前按整份文件转换。只需要某几页时，先用提取页面生成新 PDF，再转成 JPG。",
  },
  {
    q: "转成 JPG 后文字还能复制吗？",
    a: "不能，JPG 是图片。需要文字时用 OCR 识别，或保留原 PDF 文件。",
  },
  {
    q: "加密 PDF 能转吗？",
    a: "不能直接转。先用解密 PDF 移除打开密码，再转成图片。只有编辑限制的文件通常可以直接处理。",
  },
];

export default function PdfToJpgHighQualityPage() {
  return (
    <GuideArticle guide={guide} faq={faq}>
      <p>
        把 PDF 转成 JPG，最常被抱怨的是「转出来很糊」。原因通常不是工具不行，而是导出倍率选低了，或者原文件里的图片本身分辨率就不高。下面说清楚清晰度由什么决定，以及标准、高清、超清三档分别该在什么场景用。
      </p>

      <h2>清晰度由两件事决定</h2>
      <h3>1. 原文件的分辨率</h3>
      <p>
        如果 PDF 是 72dpi 的网页截图拼成的，放大到超清也只是一张被拉大的模糊图。扫描件同理：150dpi
        扫描的 A4 页面，文字边缘本来就虚，任何导出倍率都补不回来。<strong>源头清晰，导出才有意义。</strong>
      </p>
      <h3>2. 导出时的渲染倍率</h3>
      <p>
        工具把每一页按倍率渲染成位图。1x 适合屏幕查看，1.5x 是清晰度和体积的平衡点，2x
        接近印刷级细节。像素数按倍率的平方增长：2x 的像素量是 1x 的 4 倍，是 1.5x 的约 1.8 倍，文件体积也相应变大。
      </p>

      <h2>三档清晰度怎么选</h2>
      <ul>
        <li>
          <strong>标准（1x）</strong>：微信发送、网页配图、快速预览。体积最小，手机上阅读文字仍然可辨认。
        </li>
        <li>
          <strong>高清（1.5x，推荐）</strong>：大多数场景的默认选择，发邮件、做 PPT 配图、存档都够用。
        </li>
        <li>
          <strong>超清（2x）</strong>：需要打印、放大查看细节，或作为 OCR 的输入。文件明显变大，处理时间也更长。
        </li>
      </ul>
      <p>
        一个实用判断：JPG 用来「看」，选 1x 或 1.5x；用来「再加工」（印刷、识别、放大），选 2x。不确定时先用 1.5x 转一页试试，满意再批量处理。
      </p>

      <h2>具体操作步骤</h2>
      <ol>
        <li>打开「PDF 转 JPG」工具。</li>
        <li>上传 PDF，最多 10 个文件，单个不超过 50MB。</li>
        <li>在「图片清晰度」里选择标准、高清（推荐）或超清。</li>
        <li>点击转换。每一页生成一张 JPG，文件名带页码，按页顺序编号。</li>
        <li>按需下载单张，或点「下载全部」打包成 ZIP。</li>
      </ol>

      <GuideToolCta
        href="/pdf-to-jpg"
        label="PDF 转 JPG（三档清晰度，本地转换）"
        description="每页输出一张 JPG，支持批量与打包下载，可调标准、高清、超清。"
      />

      <h2>为什么转出来还是糊</h2>
      <ul>
        <li>
          <strong>原 PDF 是低分辨率扫描件。</strong>先把原文件放大到 200% 看看，如果还是糊，源头就救不回来。
        </li>
        <li>
          <strong>PDF 里的图片被严重压缩过。</strong>从聊天软件转存的文件，图片本身已有压缩痕迹，再导出只会把损失固定下来。
        </li>
        <li>
          <strong>页面尺寸小但内容密集。</strong>A5 排版的复杂表格转成图片后，实际字号很小，建议直接用 2x。
        </li>
        <li>
          <strong>用看图软件二次压缩。</strong>下载后直接发微信会被再次压缩，重要图片建议以「文件」形式发送，而不是「图片」。
        </li>
      </ul>

      <h2>要透明背景或更小体积怎么办</h2>
      <p>
        JPG 不支持透明，而且是有损压缩。需要透明背景（logo、图标、贴纸）时，用
        <a href="/pdf-to-png">PDF 转 PNG</a>；需要控制体积时，选标准倍率，或转换后用图片压缩工具处理。PNG
        通常比同清晰度的 JPG 大，不适合几十页的批量场景。
      </p>

      <h2>转成图片后还能还原成 PDF 吗</h2>
      <p>
        可以。把 JPG 拖进
        <a href="/jpg-to-pdf">JPG 转 PDF</a>
        即可重新生成 PDF。但要注意：这样得到的是图片型 PDF，文字不可搜索、不可复制，体积也可能更大。如果只是想在手机上翻看，直接看原
        PDF 更合适；如果是给不能打开 PDF 的人看，单独发 JPG 更省事。
      </p>
      <p>
        另一个常见用途是把扫描页转成图片后做 OCR：这时务必选 2x，模糊的输入会直接拉低识别率。识别流程参见
        <a href="/guides/scanned-pdf-to-text/">扫描件 PDF 转文字教程</a>。
      </p>
    </GuideArticle>
  );
}
