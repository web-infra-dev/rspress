import { Schema, type NodeSpec, type MarkSpec } from 'prosemirror-model';

function getHtmlAttributes(node: HTMLElement): Record<string, string> {
  const attrs = Object.fromEntries(
    Array.from(node.attributes).map(item => [item.name, item.value]),
  );
  return attrs;
}

function getAttrs(node: string | HTMLElement) {
  if (typeof node === 'string') {
    return null;
  } else {
    return {
      domAttrs: getHtmlAttributes(node),
    };
  }
}

function doc(): NodeSpec {
  return {
    content: 'block+',
  };
}

function text(): NodeSpec {
  return {
    group: 'inline',
  };
}

function paragraph(): NodeSpec {
  return {
    content: 'inline*',
    group: 'block',
    attrs: {
      domAttrs: {
        default: null,
      },
    },
    parseDOM: [{ tag: 'p', getAttrs }],
    toDOM(node) {
      return [
        `p`,
        {
          ...node.attrs.domAttrs,
        },
        0,
      ];
    },
  };
}

function heading(level: number): NodeSpec {
  function tag() {
    return `h${level}`;
  }
  return {
    content: 'inline*',
    group: 'block',
    attrs: {
      domAttrs: {
        default: null,
      },
    },
    parseDOM: [
      {
        tag: tag(),
        getAttrs(node) {
          if (typeof node === 'string') {
            return null;
          }
          const attrs = getAttrs(node)!;
          return {
            ...attrs,
          };
        },
      },
    ],
    toDOM(node) {
      return [
        tag(),
        {
          ...node.attrs.domAttrs,
        },
        0,
      ];
    },
  };
}

function blockquote(): NodeSpec {
  return {
    attrs: {
      domAttrs: {
        default: null,
      },
    },
    content: 'block+',
    group: 'block',
    defining: true,
    parseDOM: [{ tag: 'blockquote', getAttrs }],
    toDOM(node) {
      return ['blockquote', node.attrs.domAttrs, 0];
    },
  };
}

function hr(): NodeSpec {
  return {
    attrs: {
      domAttrs: {
        default: null,
      },
    },
    group: 'block',
    parseDOM: [{ tag: 'hr', getAttrs }],
    toDOM(node) {
      return ['hr', node.attrs.domAttrs];
    },
  };
}

function ol(): NodeSpec {
  return {
    attrs: {
      domAttrs: {
        default: null,
      },
    },
    group: 'block',
    content: 'list_item*',
    parseDOM: [
      {
        tag: 'ol',
        getAttrs,
      },
    ],
    toDOM(node) {
      return ['ol', node.attrs.domAttrs, 0];
    },
  };
}

function ul(): NodeSpec {
  return {
    attrs: {
      domAttrs: {
        default: null,
      },
    },
    group: 'block',
    content: 'list_item*',
    parseDOM: [
      {
        tag: 'ul',
        getAttrs,
      },
    ],
    toDOM(node) {
      return ['ul', node.attrs.domAttrs, 0];
    },
  };
}

function li(): NodeSpec {
  return {
    attrs: {
      domAttrs: {
        default: null,
      },
    },
    defining: true,
    group: 'list_item',
    content: 'block*',
    parseDOM: [
      {
        tag: 'li',
        getAttrs,
      },
    ],
    toDOM(node) {
      return ['li', node.attrs.domAttrs, 0];
    },
  };
}

function unknownBlock(props: Props): NodeSpec {
  return {
    marks: '',
    attrs: {
      element: {
        default: null,
      },
    },
    atom: true,
    group: 'block',
    defining: true,
    parseDOM: [
      {
        tag: '*',
        priority: 0,
        consuming: false,
        getAttrs(node) {
          if (typeof node === 'string') {
            return false;
          } else if (node.parentNode !== props.container) {
            return false;
          }
          return { element: node };
        },
      },
    ],
  };
}

function unknownInline(): NodeSpec {
  return {
    marks: '',
    attrs: {
      element: {
        default: null,
      },
    },
    inline: true,
    group: 'inline',
    defining: true,
    parseDOM: [
      {
        tag: '*',
        priority: 0,
        getAttrs(node) {
          return {
            element: node,
          };
        },
      },
    ],
  };
}

function simpleMarkSpec(tag: string): () => MarkSpec {
  return () => {
    return {
      attrs: {
        domAttrs: {
          default: null,
        },
      },
      parseDOM: [
        {
          tag,
          getAttrs,
        },
      ],
      toDOM(node) {
        return [tag, node.attrs.domAttrs, 0];
      },
    };
  };
}

const link = simpleMarkSpec('a');
const strong = simpleMarkSpec('strong');
const em = simpleMarkSpec('em');
const del = simpleMarkSpec('del');
const code = simpleMarkSpec('code');

type Props = {
  container: HTMLElement;
};

export function schema(props: Props) {
  const nodes = {
    doc: doc(),
    text: text(),
    p: paragraph(),
    h1: heading(1),
    h2: heading(2),
    h3: heading(3),
    h4: heading(4),
    h5: heading(5),
    h6: heading(6),
    blockquote: blockquote(),
    hr: hr(),
    ol: ol(),
    ul: ul(),
    li: li(),
    unknownBlock: unknownBlock(props),
    unknownInline: unknownInline(),
  };
  const marks = {
    a: link(),
    strong: strong(),
    em: em(),
    del: del(),
    code: code(),
  };
  const s = new Schema({
    nodes,
    marks,
  });
  return s;
}
