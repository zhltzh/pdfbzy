import type { Metadata } from "next";
import { getGuideBySlug, getGuideMetadata } from "@/config/guides";
import { GuideArticle, GuideToolCta } from "@/components/guides/guide-article";

export const metadata: Metadata = getGuideMetadata("merge-multiple-pdfs");
const guide = getGuideBySlug("merge-multiple-pdfs")!;

const faq = [
  {
    q: "一次能合并多少个文件？",
    a: "最多 10 个，单个不超过 50MB。文件更多时可以分两批合并，再把两个结果合并一次。",
  },
  {
    q: "合并后画质会下降吗？",
    a: "不会。合并是无损拼接，页面内容、文字层和图片分辨率都保持原样。",
  },
  {
    q: "能把图片直接合并进去吗？",
    a: "合并 PDF 只接受 PDF 文件。图片请先用 JPG 转 PDF 或图片转 PDF 生成 PDF，再参与合并。",
  },
  {
    q: "文件顺序弄错了怎么办？",
    a: "在上传列表里移除后，按正确顺序重新添加；已经合并完成的，可以用重排页面拖动页面调整。",
  },
  {
    q: "合并后的文件能拆分回去吗？",
    a: "可以。用拆分 PDF 按页分离，或用提取页面只保留需要的部分。",
  },
];

export default function MergeMultiplePdfsPage() {
  return (
    <GuideArticle guide={guide} faq={faq}>
      <p>
        把多个 PDF 合并成一个，是整理合同附件、报销凭证、课程资料时最常见的操作。合并本身很简单，真正容易出问题的是顺序、页面尺寸和加密状态。下面给出三步合并流程，以及合并前建议检查的
        4 件事，避免合完才发现要返工。
      </p>

      <h2>合并顺序由上传顺序决定</h2>
      <p>
        工具按文件列表从上到下依次拼接，第一个文件排在最前面。想调整顺序，在上传列表里移除文件后按正确次序重新添加；合并完成后也可以用
        <a href="/reorder-pages">重排页面</a>
        拖动页面微调。上传后先看一眼列表，比合并完再拆开重做省事得多。
      </p>

      <h2>具体操作步骤</h2>
      <ol>
        <li>打开「合并 PDF」工具。</li>
        <li>一次选择多个 PDF（至少 2 个），最多 10 个，单个不超过 50MB。</li>
        <li>检查文件列表顺序，把选错的文件移除。</li>
        <li>点击「合并 N 个 PDF 文件」。处理全程在浏览器本地完成，文件不会上传。</li>
        <li>下载 merged-output.pdf，按需要重命名后归档。</li>
      </ol>

      <GuideToolCta
        href="/merge-pdf"
        label="合并 PDF（最多 10 个文件，无损拼接）"
        description="拖入多个 PDF，按列表顺序合成一份，文字层和画质完整保留。"
      />

      <h2>合并前建议检查的 4 件事</h2>
      <h3>1. 页面尺寸是否一致</h3>
      <p>
        A4 和 Letter 混在一起，合并后不会自动统一，打印时会出现缩放或留白。正式材料建议先在源文件里统一纸张尺寸；已经生成
        PDF 的，可以接受差异，或用
        <a href="/crop-pdf">裁剪 PDF</a>
        微调可见区域。
      </p>
      <h3>2. 页面方向是否一致</h3>
      <p>
        横向扫描的合同页插在纵向文档里，阅读时要不停转屏。先用
        <a href="/rotate-pdf">旋转 PDF</a>
        把方向校正，再合并，比合并后逐页旋转轻松。
      </p>
      <h3>3. 是否有加密文件</h3>
      <p>
        带打开密码的 PDF 无法直接读取合并，需要先用
        <a href="/unlock-pdf">解密 PDF</a>
        移除密码。只有「禁止编辑」限制的文件通常可以正常处理。
      </p>
      <h3>4. 体积是否过大</h3>
      <p>
        合并不会压缩，10 份 5MB 的文件合完就是 50MB 左右。如果最终要邮件发送或上传系统，可以先分别
        <a href="/compress-pdf">压缩</a>
        再合并，或合并后整体压一次。注意压缩会损失画质，送审材料优先考虑拆成多个附件，而不是压到模糊。
      </p>

      <h2>合并后常见的两件事</h2>
      <h3>加页码</h3>
      <p>
        多份文件拼在一起后，原来的页码会重复或错乱。用
        <a href="/page-number">添加页码</a>
        统一加一遍，选择「第 X 页 / 共 Y 页」最稳妥。如果原页码需要保留，可以把新页码放在与原来相反的位置，例如原来在底部居中，新页码放顶部靠右。
      </p>
      <h3>提取或删除页面</h3>
      <p>
        合并后如果发现夹带了无关页，用
        <a href="/delete-pages">删除页面</a>
        去掉；只需要其中几页时，用
        <a href="/extract-pages">提取页面</a>
        生成精简版。合并前先在各自文件里处理干净，效率更高。
      </p>

      <h2>一个实用建议：先统一，再合并</h2>
      <p>
        多份材料来源不同，最容易在合并后暴露问题：某页横着、某页特别大、某份带密码。把「旋转、裁剪、解密、压缩」这些单文件处理步骤提前做完，最后一步合并就会一次成功。合并后的文件建议立刻按「项目名-日期」重命名，避免和原文件混淆。
      </p>
    </GuideArticle>
  );
}
