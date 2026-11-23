import type { Metadata } from "next";
import { getGuideBySlug, getGuideMetadata } from "@/config/guides";
import { GuideArticle, GuideToolCta } from "@/components/guides/guide-article";

export const metadata: Metadata = getGuideMetadata("extract-pages-from-pdf");
const guide = getGuideBySlug("extract-pages-from-pdf")!;

const faq = [
  {
    q: "提取某几页会把文件变小吗？",
    a: "会，只保留选中的页面，体积通常按比例下降。但如果单页里嵌了很大的图片，这一页本身仍然可能占几百 KB。",
  },
  {
    q: "能一次提取多个 PDF 的页面吗？",
    a: "当前一次处理一个文件。需要从多份文件各取几页时，分别提取后，再用「合并 PDF」拼成一份。",
  },
  {
    q: "提取页面和拆分 PDF 有什么区别？",
    a: "提取可以自由勾选任意页，合成一个文件；拆分是把每一页都生成独立文件，适合逐页归档。只想要其中几页时，用提取更省事。",
  },
  {
    q: "提取出来的 PDF 还能搜索文字吗？",
    a: "能。提取只复制原页面对象，文字层、矢量和链接都原样保留，不会变成图片。",
  },
  {
    q: "手机能用吗？",
    a: "能，页缩略图在触屏上直接点选即可，无需安装 App，文件也不会离开手机。",
  },
];

export default function ExtractPagesFromPdfPage() {
  return (
    <GuideArticle guide={guide} faq={faq}>
      <p>
        只想要 PDF 里的某几页，最省事的做法是「提取页面」：上传文件、在缩略图上勾选需要的页、导出一个新的
        PDF，不必装软件，也不会像截图那样丢画质。下面把提取页面、拆分、删除页面这三种容易混淆的操作讲清楚，再给出可以直接照做的步骤。
      </p>

      <h2>三种需求，别用错工具</h2>
      <ul>
        <li>
          <strong>只要其中几页</strong>（例如第 3、7、12 页）→ 用
          <a href="/extract-pages">提取 PDF 页面</a>
        </li>
        <li>
          <strong>每一页都要单独成文件</strong>（例如发票逐页归档）→ 用
          <a href="/split-pdf">拆分 PDF</a>
        </li>
        <li>
          <strong>只要去掉其中几页，其余全部保留</strong> → 用
          <a href="/delete-pages">删除 PDF 页面</a>
        </li>
      </ul>
      <p>三种操作都不改变页面内容，区别只在于最后保留哪些页。选错工具不会损坏文件，但会多花时间重来一遍。</p>

      <h2>用「提取 PDF 页面」的具体步骤</h2>
      <ol>
        <li>打开「提取 PDF 页面」工具。</li>
        <li>上传一个 PDF，单文件上限 50MB。文件在浏览器本地解析，不会上传到服务器。</li>
        <li>页面以缩略图展示，依次点击需要的页面即可选中，再点一次取消。</li>
        <li>确认底部显示的「已选 N 页」，点击「提取选中的 N 页」。</li>
        <li>下载生成的新 PDF，文件名形如「原文件名-提取N页.pdf」，便于和原文件区分。</li>
      </ol>

      <GuideToolCta
        href="/extract-pages"
        label="提取 PDF 页面（缩略图勾选，无损导出）"
        description="上传一个 PDF，点选需要的页面，几秒生成新文件，全程本地处理。"
      />

      <h2>提取会掉画质吗</h2>
      <p>
        不会。提取只复制原页面的对象，不重新渲染、不重新压缩图片，文字层、矢量图、链接和表单注释都保留。这一点和「先转图片再拼回
        PDF」有本质区别：后者会把文字变成像素，既模糊又无法搜索。
      </p>
      <p>
        如果提取后看起来「变小了」，通常是错觉或预览缩放造成的。可以对比原页和导出页的文字清晰度，正常情况完全一致。
      </p>

      <h2>输出顺序和页面尺寸</h2>
      <p>
        输出按原文档页码从小到大排列，即使你的勾选顺序是乱的。页面尺寸也保持原样，A4 和 A5
        混排不会被强行缩放，打印时按各自尺寸输出。若需要打乱顺序，提取后再用
        <a href="/reorder-pages">重排页面</a>
        拖动调整。
      </p>

      <h2>常见问题与处理办法</h2>
      <h3>文件超过 50MB 传不进去</h3>
      <p>
        先用<a href="/compress-pdf">压缩 PDF</a>
        压一版再提取，或先删除无关页减小体积。注意压缩会改变画质，如果原文件要送审，优先考虑在源文件里拆分大文件，而不是硬压。
      </p>
      <h3>打不开或提示加密</h3>
      <p>
        有打开密码的 PDF 需要先
        <a href="/unlock-pdf">解密</a>
        ；只带「禁止编辑」限制的文件通常可以直接处理。若密码未知，请联系文件提供方。
      </p>
      <h3>页数太多，找不到目标页</h3>
      <p>
        缩略图会按页码顺序排列，超过 100 页时首次渲染需要几秒。先在心里记下目标页码，再滚动定位，比一页页翻快。
      </p>
      <h3>最终想要的是图片而不是 PDF</h3>
      <p>
        如果目的是发给别人看，用
        <a href="/pdf-to-jpg">PDF 转 JPG</a>
        直接按页导出图片更合适，省去提取这一步。
      </p>

      <h2>提取之后还能做什么</h2>
      <p>
        提取出来的几页可以继续
        <a href="/merge-pdf">合并</a>
        到另一份文件、加
        <a href="/page-number">页码</a>、加
        <a href="/watermark-pdf">水印</a>
        ，或转成图片。例如把多份证明材料的签字页各提取一页，合并成一份「签字页汇总」，比整份材料传来传去清晰得多。
      </p>
    </GuideArticle>
  );
}
