import React from 'react';
import type { EditorView } from 'prosemirror-view';
import { pm } from './pm';
import './style.css';
import { AddComment, computeCommentPos } from './component/AddComment';
import { CommnetDisplay, getComments } from './component/CommentDisplay';

const DOC_CLASSNAME = '.rspress-doc';

function Container() {
  const viewRef = React.useRef<EditorView>();
  const [, forceUpdate] = React.useReducer<React.ReducerWithoutAction<number>>(
    x => x + 1,
    0,
  );

  React.useEffect(() => {
    const dom = document.querySelector<HTMLElement>(DOC_CLASSNAME);
    if (!dom) {
      return undefined;
    }
    viewRef.current = pm(dom, forceUpdate);
    return () => {
      if (viewRef.current) {
        viewRef.current.destroy();
      }
    };
  }, []);

  if (!viewRef.current) {
    return <></>;
  }

  const commentPos = computeCommentPos(viewRef.current);
  const comments = getComments(viewRef.current);
  return (
    <>
      {commentPos ? (
        <AddComment
          state={viewRef.current.state}
          dispatch={viewRef.current.dispatch}
          left={commentPos.left}
          top={commentPos.top}
        />
      ) : (
        <></>
      )}
      {comments ? <CommnetDisplay {...comments} /> : <></>}
    </>
  );
}

export default Container;
