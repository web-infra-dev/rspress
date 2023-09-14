import { EditorView } from 'prosemirror-view';
import { COMMENT_PLUGIN_KEY } from '../pm/comment';

type Props = {
  comments: string[];
  left: number;
  top: number;
};

export function CommnetDisplay(props: Props): React.ReactElement {
  const offset = 10;

  return (
    <div
      style={{
        position: 'absolute',
        left: props.left,
        top: props.top + offset,
      }}
      className="inline-block relative w-0 overflow-visible align-bottom"
    >
      {props.comments.map((comment, index) => {
        return (
          <div
            key={index}
            className="absolute top-[calc(100%+8px)] left-8 text-base w-60 text-black bg-white font-normal border border-gray-400 rounded-md z-10 p-0"
          >
            {comment}
          </div>
        );
      })}
    </div>
  );
}

export function getComments(view: EditorView): undefined | Props {
  const sel = view.state.selection;
  if (!sel.empty) {
    return undefined;
  }
  const pluginState = COMMENT_PLUGIN_KEY.getState(view.state);
  if (!pluginState) {
    return undefined;
  }
  const { decoSet } = pluginState;
  const comment = decoSet.find(sel.from, sel.from);
  if (!comment || comment.length === 0) {
    return undefined;
  }
  const { left, top } = view.coordsAtPos(sel.from);
  return {
    comments: comment.map(item => item.spec.comment as string),
    left,
    top,
  };
}
