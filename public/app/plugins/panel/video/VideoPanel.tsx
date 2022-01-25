import React from 'react';
import { PanelProps } from '@grafana/data';
import { PanelOptions } from './models.gen';
import videojs from 'video.js';
import VideoJS from './VideoJS';

interface VideoPanelProps extends PanelProps<PanelOptions> {}

export const HeatmapPanel: React.FC<VideoPanelProps> = ({
  data,
  id,
  timeRange,
  timeZone,
  width,
  height,
  options,
  fieldConfig,
  onChangeTimeRange,
  replaceVariables,
}) => {
  const playerRef = React.useRef<videojs.Player>();

  const videoJsOptions = {
    // lookup the options in the docs for more options
    autoplay: true,
    controls: true,
    responsive: true,
    fluid: true,
    mute: true,
    sources: [
      {
        src: 'https://interactive-examples.mdn.mozilla.net/media/cc0-videos/flower.mp4',
        //src: 'http://localhost:3000/public/videos/skate.mp4',
        type: 'video/mp4',
      },
    ],
    width,
    height,
  };

  const handlePlayerReady = (player: videojs.Player) => {
    playerRef.current = player;
    console.log('ready', player);

    player.on('waiting', (v: any) => {
      console.log('waiting', v);
    });

    player.on('progress', (v: any) => {
      console.log('progress', v);
    });

    player.on('loadedmetadata', (v: any) => {
      console.log('loadedmetadata', v);
    });

    player.on('durationchange', (v: any) => {
      console.log('durationchange', v);
    });

    player.on('timeupdate', (v: any) => {
      console.log('timeupdate', { durration: player.duration(), xxx: player.currentTime(), jj: player.toJSON() });
    });

    player.on('dispose', () => {
      console.log('player will dispose');
    });
  };

  // const changePlayerOptions = () => {
  //   // you can update the player through the Video.js player instance
  //   if (!playerRef.current) {
  //     return;
  //   }
  //   // [update player through instance's api]
  //   playerRef.current.src([{src: 'http://ex.com/video.mp4', type: 'video/mp4'}]);
  //   playerRef.current.autoplay(false);
  // };

  return (
    <>
      <VideoJS options={videoJsOptions} onReady={handlePlayerReady} />
    </>
  );
};
