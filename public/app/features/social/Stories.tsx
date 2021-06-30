import React from 'react';
import VideoRecorder from './VideoRecorder';
const axios = require('axios');
import { useIndexedDB } from 'react-indexed-db';
import { uniq } from 'lodash';
import ReactModal from 'react-modal';
import { ClickOutsideWrapper } from '../../../../packages/grafana-ui/src';

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

  console.log('user', (window as any).grafanaBootData.user);

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
  const { srcBlob, showStory, closeStory } = props;

  if (!srcBlob) {
    return null;
  }

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
          src={URL.createObjectURL(srcBlob)}
          autoPlay
          onEnded={() => closeStory()}
        />
      </ClickOutsideWrapper>
    </ReactModal>
  );
};

const Story = (props: { avatar: string; username: string; stories: any }) => {
  const { avatar, username, stories } = props;
  const [showStory, setShowStory] = React.useState(false);
  const [blob, setBlob] = React.useState<any>();

  const currentUser = (window as any).grafanaBootData.user;
  const isCurrentUser = username === 'Your story';

  const openStory = (ev: any) => {
    console.log('clicked avatar', username);
    setShowStory(true);
    console.log('stories', stories);
    setBlob(stories.find((s: any) => s.name === (isCurrentUser ? currentUser.login : username)).blob);
  };

  const closeStory = () => {
    setBlob(undefined);
    setShowStory(!showStory);
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
                color: '#db2a2a',
                transform: 'scale(1.25)',
                zIndex: 1,
              }}
            >
              <VideoRecorder />
            </div>
          )}
        </div>
        <span>{username || 'Your story'}</span>
      </div>
      <StoryPlayer srcBlob={blob} showStory={showStory} closeStory={closeStory} />
    </>
  );
};

export default Stories;
