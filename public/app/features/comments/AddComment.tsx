import React, { FormEvent, useState } from 'react';

import { TextArea } from '@grafana/ui';

interface Props {
  addComment: (comment: string) => Promise<boolean>;
}

export const AddComment = ({ addComment }: Props) => {
  const [comment, setComment] = useState('');
  const onChange = (event: FormEvent<HTMLTextAreaElement>) => {
    const element = event.target as HTMLInputElement;
    setComment(element.value);
  };

  const onKeyPress = async (event: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (event?.key === 'Enter' && !event?.shiftKey) {
      event.preventDefault();

      if (comment.length > 0) {
        const result = await addComment(comment);
        if (result) {
          setComment('');
        }
      }
    }
  };

  return (
    <TextArea
      placeholder="Write a comment"
      value={comment}
      onChange={onChange}
      onKeyPress={onKeyPress}
      autoFocus={true}
    />
  );
};
