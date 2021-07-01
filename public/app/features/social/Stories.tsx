import React from 'react';
import VideoRecorder from './VideoRecorder';
const axios = require('axios');
import { useIndexedDB } from 'react-indexed-db';
import { uniq } from 'lodash';
import ReactModal from 'react-modal';
import { ClickOutsideWrapper } from '../../../../packages/grafana-ui/src';
import { setPausedStateAction } from '../explore/state/query';

const styles = {
  background: {
    padding: '0px 8px',
    borderRadius: '2px',
    lineHeight: '30px',
    fontWeight: 500,
    border: '1px solid rgba(204, 204, 220, 0.07)',
    color: 'rgba(204, 204, 220, 0.65)',
    backgroundColor: '#181b1f',
    marginBottom: '15px',
  },
};

const Stories = () => {
  const [users, setUsers] = React.useState<any>([]);
  const [allStories, setAllStories] = React.useState<any>([]);
  const { getAll } = useIndexedDB('social');

  const currentUser = (window as any).grafanaBootData.user;

  React.useEffect(() => {
    async function getUsers() {
      const response = await axios({
        method: 'get',
        url: '/api/users?perpage=10&page=1',
        responseType: 'stream',
        // example of admin:admin creds, need better way of having access to api
        headers: {
          Authorization: `Basic YWRtaW46YWRtaW4=`,
        },
      });

      setUsers(response.data);

      const allStories: any = await getAll();

      setAllStories(allStories);
    }

    getUsers();
  }, []);

  const stories = [
    {
      avatar: currentUser.gravatarUrl,
      username: currentUser.login,
    },
    ...users
      .filter(
        (user: any) => user.login !== currentUser.login && uniq(allStories.map((s: any) => s.name)).includes(user.login)
      )
      .map((user: any) => ({
        avatar: user.avatarUrl,
        username: user.login,
      })),
  ];

  return (
    <div style={styles.background}>
      <h3 style={{ padding: '10px 2px' }}>Stories</h3>
      <div className="stories-container" style={{ display: 'flex', maxWidth: 'min-content' }}>
        {stories.map((story: any, index: number) => (
          <div key={story.username}>
            <Story avatar={story.avatar} username={index === 0 ? 'Your story' : story.username} stories={allStories} />
          </div>
        ))}
      </div>
    </div>
  );
};

const StoryPlayer = (props: any) => {
  const { stories, showStory, closeStory } = props;

  if (!stories || stories.length === 0) {
    return null;
  }

  // eslint-disable-next-line react-hooks/rules-of-hooks
  const [index, setIndex] = React.useState(0);

  // eslint-disable-next-line react-hooks/rules-of-hooks
  const [currentStory, setCurrentStory] = React.useState<any>(stories[index]);

  const queueStories = () => {
    setIndex(index + 1);

    if (index + 1 >= stories.length) {
      closeStory();
      return;
    }

    setCurrentStory(stories[index + 1]);
  };

  return (
    <ReactModal
      isOpen={showStory}
      contentLabel="Minimal Modal Example"
      ariaHideApp={false}
      style={{ overlay: { zIndex: 1000 }, content: { background: 'transparent' } }}
    >
      <ClickOutsideWrapper onClick={() => closeStory()} useCapture={true}>
        <video
          id="story-video"
          style={{
            maxWidth: '80%',
            display: 'block',
            margin: '0 auto',
          }}
          src={URL.createObjectURL(currentStory)}
          autoPlay
          onEnded={() => queueStories()}
        />
      </ClickOutsideWrapper>
    </ReactModal>
  );
};

const Story = (props: { avatar: string; username: string; stories: any }) => {
  const { avatar, username, stories } = props;
  const [showStory, setShowStory] = React.useState(false);
  const [userStories, setUserStories] = React.useState<any>([]);

  const currentUser = (window as any).grafanaBootData.user;
  const isCurrentUser = username === 'Your story';

  const openStory = (ev: any) => {
    setShowStory(true);
    setUserStories(
      stories.filter((s: any) => s.name === (isCurrentUser ? currentUser.login : username)).map((s: any) => s.blob)
    );
  };

  const closeStory = () => {
    setUserStories(undefined);
    setShowStory(false);
  };

  return (
    <>
      <div
        className="story-container"
        style={{
          padding: '0 20px 20px',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
        }}
      >
        <div
          className="story-image-container"
          style={{ display: 'grid', gridTemplateColumns: 'repeat(12, 1fr)', position: 'relative' }}
          onClick={(ev) => openStory(ev)}
        >
          <div
            style={{
              gridColumn: 1,
              gridRow: 1,
              zIndex: 1,
            }}
          >
            <img
              src="public/app/features/social/grafana-story-outline.png"
              style={{
                width: '100px',
                height: '100px',
              }}
            />
          </div>
          <div style={{ gridColumn: 1, gridRow: 1 }}>
            <img
              src={avatar}
              style={{
                width: '80px',
                height: '80px',
                left: '18px',
                top: '10px',
                position: 'relative',
                borderRadius: '50%',
              }}
            />
          </div>
          {isCurrentUser && (
            <div
              style={{
                gridColumn: 1,
                gridRow: 1,
                position: 'absolute',
                bottom: 0,
                right: 0,
                zIndex: 1,
              }}
            >
              <VideoRecorder />
            </div>
          )}
        </div>
        <span>{username || 'Your story'}</span>
      </div>
      <StoryPlayer stories={userStories} showStory={showStory} closeStory={closeStory} />
    </>
  );
};

export default Stories;
