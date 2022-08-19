import { css } from '@emotion/css';
import React, { useLayoutEffect, useRef, useState } from 'react';

import { GrafanaTheme2 } from '@grafana/data';
import { CustomScrollbar, useStyles2 } from '@grafana/ui';

import { AddComment } from './AddComment';
import { Comment } from './Comment';
import { Message } from './types';

type Props = {
  comments: Message[];
  packetCounter: number;
  addComment: (comment: string) => Promise<boolean>;
  updateRating: (index: number, id: number, rating: number) => void;
};

export const CommentView = ({ comments, packetCounter, addComment, updateRating }: Props) => {
  const styles = useStyles2(getStyles);

  const [scrollTop, setScrollTop] = useState(0);
  const commentViewContainer = useRef<HTMLDivElement>(null);

  useLayoutEffect(() => {
    if (commentViewContainer.current) {
      setScrollTop(commentViewContainer.current.offsetHeight);
    } else {
      setScrollTop(0);
    }
  }, [packetCounter]);

  return (
    <CustomScrollbar scrollTop={scrollTop}>
      <div ref={commentViewContainer} className={styles.commentViewContainer}>
        {comments.map((msg, i) => (
          <Comment key={msg.id} message={msg} updateRating={(id, rating) => updateRating(i, id, rating)} />
        ))}
        <AddComment addComment={addComment} />
      </div>
    </CustomScrollbar>
  );
};

const getStyles = (theme: GrafanaTheme2) => ({
  commentViewContainer: css`
    margin: 5px;
  `,
});
