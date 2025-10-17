import { renderToMarkdownString } from './render.js';

const markdown = renderToMarkdownString(
  <div>
    <h1>标题</h1>
    <p>
      这是一个<strong>粗体</strong>文本。
    </p>
  </div>,
);

console.log(markdown, 33333333);
// # 标题
//
// 这是一个**粗体**文本。
