import React from 'react';

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
  const stories = [
    {
      avatar: 'public/app/features/social/avatar.jpeg',
    },
    {
      avatar: 'public/app/features/social/avatar.jpeg',
      username: 'whatever',
    },
    {
      avatar: 'public/app/features/social/avatar.jpeg',
      username: 'another user',
    },
  ];

  return (
    <div style={styles.background}>
      <h3 style={{ padding: '10px 2px' }}>Stories</h3>
      <div className="stories-container" style={{ display: 'flex', maxWidth: 'min-content' }}>
        {stories.map((story) => (
          <div key={story.username}>
            <Story avatar={story.avatar} username={story.username} />
          </div>
        ))}
      </div>
    </div>
  );
};

const Story = (props: { avatar: string; username?: string }) => {
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
