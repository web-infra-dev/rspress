import { EditorView } from 'prosemirror-view';
import { DOMParser } from 'prosemirror-model';
import { EditorState } from 'prosemirror-state';
import { schema } from './model';
import { COMMENT_PLUGIN } from './comment';
import { unknownBlockView, unknownInlineView } from './view';

export function pm(
  dom: HTMLElement,
  update: React.DispatchWithoutAction,
): EditorView {
  const s = schema({ container: dom });
  const json = DOMParser.fromSchema(s).parse(dom).toJSON();
  const state = EditorState.create({
    doc: s.nodeFromJSON(json),
    plugins: [COMMENT_PLUGIN],
  });

  while (dom.firstChild) {
    dom.firstChild.remove();
  }

  const view = new EditorView(dom, {
    state,
    nodeViews: {
      unknownBlock: unknownBlockView,
      unknownInline: unknownInlineView,
    },
    editable: () => false,
    dispatchTransaction(tr) {
      const state = view.state.apply(tr);
      view.updateState(state);
      update();
    },
  });

  return view;
}
