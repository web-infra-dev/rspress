import { Node } from 'prosemirror-model';
import { Plugin, PluginKey, Transaction } from 'prosemirror-state';
import { Decoration, DecorationSet } from 'prosemirror-view';

type Action = {
  type: 'newComment';
  from: number;
  to: number;
  comment: string;
};

const COMMENT_CLASSNAME = 'rspress-comment';

class State {
  decoSet: DecorationSet;

  constructor(decoSet: DecorationSet) {
    this.decoSet = decoSet;
  }

  apply(tr: Transaction) {
    const action: Action = tr.getMeta(COMMENT_PLUGIN_KEY);
    if (!action && !tr.docChanged) {
      return this;
    }
    let { decoSet } = this;
    if (action.type === 'newComment') {
      const list: Decoration[] = [];
      tr.doc.nodesBetween(action.from, action.to, (node, pos) => {
        const next = node.nodeSize + pos;
        if (pos < action.from) {
          list.push(this.deco(action.from, next, node, action.comment));
        } else if (next > action.to) {
          list.push(this.deco(pos, action.to, node, action.comment));
        } else {
          list.push(this.deco(pos, next, node, action.comment));
        }
      });
      decoSet = decoSet.add(tr.doc, list);
    }
    return new State(decoSet);
  }

  inlineDeco(from: number, to: number, comment: string): Decoration {
    return Decoration.inline(
      from,
      to,
      { class: COMMENT_CLASSNAME },
      { comment },
    );
  }

  blockDeco(from: number, to: number, comment: string): Decoration {
    return Decoration.node(from, to, { class: COMMENT_CLASSNAME }, { comment });
  }

  deco(from: number, to: number, node: Node, comment: string): Decoration {
    if (node.type.isBlock) {
      return this.blockDeco(from, to, comment);
    } else {
      return this.inlineDeco(from, to, comment);
    }
  }
}

export const COMMENT_PLUGIN_KEY = new PluginKey<{ decoSet: DecorationSet }>(
  'comment-plugin-key',
);

export const COMMENT_PLUGIN = new Plugin<State>({
  key: COMMENT_PLUGIN_KEY,
  state: {
    init: config => new State(DecorationSet.create(config.doc!, [])),
    apply(tr, prev) {
      return prev.apply(tr);
    },
  },
  props: {
    decorations(state) {
      return this.getState(state)?.decoSet;
    },
  },
});
