import { css } from '@emotion/css';
import DangerouslySetHtmlContent from 'dangerously-set-html-content';
import React from 'react';

import { GrafanaTheme2, renderMarkdown } from '@grafana/data';
import { useStyles2 } from '@grafana/ui';

import { Vote } from './Vote';
import { Message } from './types';

type Props = {
  message: Message;
  updateRating: (id: number, rating: number) => void;
};

export const Comment = ({ message, updateRating }: Props) => {
  const styles = useStyles2(getStyles);

  let senderColor = '#34BA18';
  let senderName = 'System';
  let avatarUrl = '/public/img/grafana_icon.svg';
  if (message.userId > 0) {
    senderColor = '#19a2e7';
    senderName = message.user.login;
    avatarUrl = message.user.avatarUrl;
  }
  const timeColor = '#898989';
  const timeFormatted = new Date(message.created * 1000).toLocaleTimeString();
  const markdownContent = renderMarkdown(message.content, { breaks: true });

  return (
    <div className={styles.comment}>
      <Vote id={message.id} rating={message?.rating ?? 0} onChange={updateRating}></Vote>
      <div className={styles.avatarContainer}>
        <img src={avatarUrl} alt="User avatar" className={styles.avatar} />
      </div>
      <div className={styles.fill}>
        <div>
          <span style={{ color: senderColor }}>{senderName}</span>
          &nbsp;
          <span style={{ color: timeColor }}>{timeFormatted}</span>
        </div>
        <div>
          <DangerouslySetHtmlContent html={markdownContent} className={styles.content} />
        </div>
      </div>
      <div className={styles.linkbar}>
        <div className={styles.linkElement}>
          <a>Reply</a>
        </div>
      </div>
    </div>
  );
};

const getStyles = (theme: GrafanaTheme2) => ({
  comment: css`
    margin-bottom: 10px;
    padding-top: 3px;
    padding-bottom: 3px;
    word-break: break-word;
    display: flex;
    flex-direction: row;
    align-items: top;
    width: 100%;

    :hover {
      background-color: #1e1f24;
    }

    blockquote {
      padding: 0 0 0 10px;
      margin: 0 0 10px;
    }
  `,
  avatarContainer: css`
    align-self: left;
    margin-top: 6px;
    margin-right: 10px;
  `,
  avatar: css`
    width: 30px;
    height: 30px;
  `,
  content: css`
    display: block;
    overflow: hidden;

    p {
      margin: 0;
      padding: 0;
    }

    blockquote p {
      font-size: 14px;
      padding-top: 4px;
    }

    a {
      color: #43c57e;
    }

    a:hover {
      text-decoration: underline;
    }
  `,
  fill: css`
    width: 100%;
  `,
  linkbar: css`
    display: flex;
    float: right;
  `,
  linkElement: css`
    text-align: center;
    margin: auto 10px;
    flex-grow: 1;
    width: 50px;
  `,
});
