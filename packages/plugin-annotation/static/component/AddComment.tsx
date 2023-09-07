import { EditorState, Transaction } from 'prosemirror-state';
import { EditorView } from 'prosemirror-view';
import React from 'react';
import CommentIcon from '../images/comment-icon.svg';
import { COMMENT_PLUGIN_KEY } from '../pm/comment';

type Props = {
  left: number;
  top: number;
  state: EditorState;
  dispatch: (tr: Transaction) => void;
};

const enum State {
  Popover,
  Input,
  Hiden,
}

export function AddComment(props: Props): React.ReactElement {
  const sel = props.state.selection;
  if (sel.empty) {
    return <></>;
  }

  const [state, setState] = React.useState(State.Popover);

  const addComent = (comment: string) => {
    props.dispatch(
      props.state.tr.setMeta(COMMENT_PLUGIN_KEY, {
        type: 'newComment',
        from: sel.from,
        to: sel.to,
        comment,
      }),
    );
  };

  const offset = 30;
  const Button = () => (
    <button
      style={{
        position: 'absolute',
        left: props.left,
        top: props.top - offset,
      }}
      onClick={() => setState(State.Input)}
    >
      <CommentIcon />
    </button>
  );
  const inputRef = React.useRef<HTMLInputElement>(null);
  const Input = () => (
    <div
      style={{
        position: 'absolute',
        left: props.left,
        top: props.top - offset,
      }}
    >
      <input
        ref={inputRef}
        onKeyDown={event => {
          event.stopPropagation();
          if (
            event.key === 'Enter' &&
            inputRef.current &&
            inputRef.current.value.length >= 0
          ) {
            setState(State.Hiden);
            addComent(inputRef.current.value);
          }
        }}
        className="shadow appearance-none border rounded py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
        type="text"
      />
    </div>
  );

  if (State.Popover === state) {
    return <Button />;
  } else if (State.Input === state) {
    return <Input />;
  } else {
    return <></>;
  }
}

export function computeCommentPos(
  view: EditorView,
): undefined | { left: number; top: number } {
  const sel = view.state.selection;
  if (sel.empty) {
    return undefined;
  }
  const { head } = view.state.selection;
  const { left, top } = view.coordsAtPos(head);
  return { left, top };
}
