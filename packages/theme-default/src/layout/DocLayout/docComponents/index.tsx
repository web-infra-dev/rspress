import { A } from './a';
import { Code } from './code';
import { Hr } from './hr';
import { Img } from './img';
import { Li, Ol, Ul } from './list';
import { Blockquote, P, Strong } from './paragraph';
import { Pre } from './pre';
import { Table, Td, Th, Tr } from './table';
import { H1, H2, H3, H4, H5, H6 } from './title';

export function getCustomMDXComponent() {
  return {
    h1: H1,
    h2: H2,
    h3: H3,
    h4: H4,
    h5: H5,
    h6: H6,
    ul: Ul,
    ol: Ol,
    li: Li,
    table: Table,
    td: Td,
    th: Th,
    tr: Tr,
    hr: Hr,
    p: P,
    blockquote: Blockquote,
    strong: Strong,
    a: A,
    code: Code,
    pre: Pre,
    img: Img,
  };
}
