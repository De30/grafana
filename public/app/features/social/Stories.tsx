import React from 'react';
import VideoRecorder from './VideoRecorder';
const axios = require('axios');
import { useIndexedDB } from 'react-indexed-db';
import { uniq, uniqBy } from 'lodash';

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
            <Story avatar={story.avatar} username={index === 0 ? 'Your story' : story.username} />
          </div>
        ))}
      </div>
      <VideoRecorder users={users} />
    </div>
  );
};

const openStory = (username: string) => {
  console.log('clicked avatar', username);
};

const Story = (props: { avatar: string; username: string }) => {
  const { avatar, username } = props;

  return (
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
        onClick={() => openStory(username)}
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
              left: '19px',
              top: '10px',
              position: 'relative',
              borderRadius: '50%',
            }}
          />
        </div>
      </div>
      <span>{username || 'Your story'}</span>
    </div>
  );
};

export default Stories;
