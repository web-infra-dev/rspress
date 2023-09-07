import { NodeViewConstructor } from 'prosemirror-view';

export const unknownBlockView: NodeViewConstructor = node => {
  return {
    dom: node.attrs.element,
    stopEvent() {
      return true;
    },
    ignoreMutation() {
      return true;
    },
  };
};

export const unknownInlineView: NodeViewConstructor = node => {
  return {
    dom: node.attrs.element,
    stopEvent() {
      return true;
    },
    ignoreMutation() {
      return true;
    },
  };
};
