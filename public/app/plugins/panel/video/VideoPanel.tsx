import React, { PureComponent } from 'react';
import { EventBus, DataHoverEvent, PanelProps } from '@grafana/data';
import { Subscription } from 'rxjs';
import { PanelOptions } from './models.gen';
import videojs from 'video.js';
import VideoJSWrapper from './VideoJSWrapper';
import { VideoPlayPayload } from './types';

interface Props extends PanelProps<PanelOptions> {}

interface State {
  over?: boolean;
  opts: videojs.PlayerOptions;
  duration: number; // seconds;
}

export class VideoPanel extends PureComponent<Props, State> {
  player?: videojs.Player;
  subscription = new Subscription();
  eventBus: EventBus;
  hoverPayload: VideoPlayPayload = { point: {} as any };
  hoverEvent = new DataHoverEvent(this.hoverPayload);

  constructor(props: Props) {
    super(props);

    this.eventBus = props.eventBus.newScopedBus('local', { onlyLocal: true });
    this.state = {
      over: false,
      duration: 0,
      opts: {
        // lookup the options in the docs for more options
        autoplay: false,
        controls: true,
        responsive: true,
        fluid: true,
        fill: true,
        muted: true,
        sources: [
          {
            //        src: 'https://interactive-examples.mdn.mozilla.net/media/cc0-videos/flower.mp4',
            // src: 'https://storage.googleapis.com/grafana-downloads/files/temp/PXL-20220122.mp4',
            src: 'https://storage.googleapis.com/grafana-downloads/files/temp/sample-10s.mp4',
            //src: 'http://localhost:3000/public/videos/skate.mp4',
            type: 'video/mp4',
          },
        ],
        width: props.width,
        height: props.height,
      },
    };
  }

  componentDidMount() {
    const { eventBus } = this.props;

    this.subscription.add(
      eventBus.subscribe(DataHoverEvent, (event) => {
        if (event.origin === this.eventBus) {
          return;
        }

        const { duration } = this.state;
        const time = event.payload?.point?.time;
        if (time && duration && this.player) {
          const start = this.props.data.timeRange.from.valueOf();
          const offset = (time - start) / 1000; // ms > s
          if (offset <= duration) {
            console.log('OTHER HOVER', time);
            this.player.pause(); // do not keep playing
            this.player.currentTime(offset);
          }
        }
      })
    );
  }

  componentWillUnmount() {
    this.subscription.unsubscribe();
  }

  handlePlayerReady = (player: videojs.Player) => {
    this.player = player;
    console.log('ready', player);

    player.on('waiting', (v: any) => {
      console.log('waiting', v);
    });

    player.on('progress', (v: any) => {
      console.log('progress', v);
    });

    // player.on('seeking', (v: any) => {
    //   console.log('seeking', v);
    // });

    // player.on('seeked', (v: any) => {
    //   console.log('seeked', v);
    // });

    player.on('ended', (v: any) => {
      console.log('ended', v);
    });

    player.on('stageclick', (v: any) => {
      console.log('stageclick', v);
    });

    player.on('loadedmetadata', (v: any) => {
      console.log('loadedmetadata', v);
    });

    player.on('durationchange', (v: any) => {
      console.log('durationchange', v);
      this.setState({ duration: player.duration() });
    });

    player.on('timeupdate', (v: any) => {
      const evt = this.hoverPayload;
      const start = this.props.data.timeRange.from.valueOf();
      const offset = player.currentTime();

      evt.point.time = offset * 1000 + start;
      evt.point.offset = offset; // seconds
      evt.point.duration = player.duration();

      this.eventBus.publish(this.hoverEvent);
    });

    player.on('dispose', () => {
      console.log('player will dispose');
      this.player = undefined;
    });
  };

  render() {
    const { opts } = this.state;
    return (
      <div>
        <VideoJSWrapper options={opts} onReady={this.handlePlayerReady} />
      </div>
    );
  }
}
