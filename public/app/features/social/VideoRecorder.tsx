// @ts-nocheck

import { truncateSync } from 'fs';
import React from 'react';

import { useIndexedDB } from 'react-indexed-db';

function isObject(o: any) {
  return o && !Array.isArray(o) && Object(o) === o;
}

/**
 * Checks whether constraints are valid
 * @param {MediaStreamConstraints} mediaType
 */
function validateMediaTrackConstraints(mediaType: MediaStreamConstraints) {
  let supportedMediaConstraints: any = null;

  if (navigator.mediaDevices) {
    supportedMediaConstraints = navigator.mediaDevices.getSupportedConstraints();
  }

  if (supportedMediaConstraints === null) {
    return;
  }

  let unSupportedMediaConstraints = Object.keys(mediaType).filter(
    (constraint) => !supportedMediaConstraints[constraint]
  );

  if (unSupportedMediaConstraints.length !== 0) {
    let toText = unSupportedMediaConstraints.join(',');
    console.error(`The following constraints ${toText} are not supported on this browser.`);
  }
}

const noop = () => {};

function useMediaRecorder({
  blobOptions,
  recordScreen,
  onStop = noop,
  onStart = noop,
  onError = noop,
  onDataAvailable = noop,
  mediaRecorderOptions,
  mediaStreamConstraints = {},
}: any) {
  let mediaChunks = React.useRef([]);
  let mediaStream = React.useRef(null);
  let mediaRecorder = React.useRef(null);
  let [error, setError] = React.useState(null);
  let [status, setStatus] = React.useState('idle');
  let [mediaBlob, setMediaBlob] = React.useState(null);
  let [isAudioMuted, setIsAudioMuted] = React.useState(false);

  const db = useIndexedDB('social');
  const { add } = useIndexedDB('social');

  async function getMediaStream() {
    if (error) {
      setError(null);
    }

    setStatus('acquiring_media');

    try {
      let stream: any;

      if (recordScreen) {
        stream = await (window.navigator.mediaDevices as any).getDisplayMedia(mediaStreamConstraints);
      } else {
        stream = await window.navigator.mediaDevices.getUserMedia(mediaStreamConstraints);
      }

      if (recordScreen && mediaStreamConstraints.audio) {
        let audioStream = await window.navigator.mediaDevices.getUserMedia({
          audio: mediaStreamConstraints.audio,
        });

        audioStream.getAudioTracks().forEach((audioTrack) => stream.addTrack(audioTrack));
      }

      mediaStream.current = stream;
      setStatus('ready');
    } catch (err) {
      setError(err);
      setStatus('failed');
    }
  }

  function clearMediaStream() {
    if (mediaRecorder.current) {
      mediaRecorder.current.removeEventListener('dataavailable', handleDataAvailable);
      mediaRecorder.current.removeEventListener('stop', handleStop);
      mediaRecorder.current.removeEventListener('error', handleError);
      mediaRecorder.current = null;
    }

    if (mediaStream.current) {
      mediaStream.current.getTracks().forEach((track) => track.stop());
      mediaStream.current = null;
      mediaChunks.current = [];
    }
  }

  async function startRecording() {
    if (error) {
      setError(null);
    }

    if (!mediaStream.current) {
      await getMediaStream();
    }

    mediaChunks.current = [];

    if (mediaStream.current) {
      mediaRecorder.current = new MediaRecorder(mediaStream.current, mediaRecorderOptions);
      mediaRecorder.current.addEventListener('dataavailable', handleDataAvailable);
      mediaRecorder.current.addEventListener('stop', handleStop);
      mediaRecorder.current.addEventListener('error', handleError);
      mediaRecorder.current.start();
      setStatus('recording');
      onStart();
    }
  }

  function handleDataAvailable(e) {
    if (e.data.size) {
      mediaChunks.current.push(e.data);
    }
    onDataAvailable(e.data);
    console.log('data is avaialble', e);

    saveFile(e.data);
  }

  function handleStop() {
    let [sampleChunk] = mediaChunks.current;
    let blobPropertyBag = Object.assign({ type: sampleChunk.type }, blobOptions);
    let blob = new Blob(mediaChunks.current, blobPropertyBag);

    setStatus('stopped');
    setMediaBlob(blob);
    onStop(blob);
  }

  function handleError(e) {
    setError(e.error);
    setStatus('idle');
    onError(e.error);
  }

  function muteAudio(mute) {
    setIsAudioMuted(mute);

    if (mediaStream.current) {
      mediaStream.current.getAudioTracks().forEach((audioTrack) => {
        audioTrack.enabled = !mute;
      });
    }
  }

  function pauseRecording() {
    if (mediaRecorder.current && mediaRecorder.current.state === 'recording') {
      setStatus('paused');
      mediaRecorder.current.pause();
    }
  }

  function resumeRecording() {
    if (mediaRecorder.current && mediaRecorder.current.state === 'paused') {
      mediaRecorder.current.resume();
      setStatus('recording');
    }
  }

  function stopRecording() {
    if (mediaRecorder.current) {
      setStatus('stopping');
      mediaRecorder.current.stop();

      mediaRecorder.current.removeEventListener('dataavailable', handleDataAvailable);
      mediaRecorder.current.removeEventListener('stop', handleStop);
      mediaRecorder.current.removeEventListener('error', handleError);
      mediaRecorder.current = null;
      clearMediaStream();
    }
  }

  const saveFile = async (blob) => {
    const user = (window as any).grafanaBootData.user;

    add({ name: user.login, blob, created_at: new Date().getTime() }).then(
      (event) => {
        console.log('saved', event);
      },
      (error) => {
        console.log(error);
      }
    );
  };

  React.useEffect(() => {
    if (!window.MediaRecorder) {
      throw new ReferenceError(
        'MediaRecorder is not supported in this browser. Please ensure that you are running the latest version of chrome/firefox/edge.'
      );
    }

    if (recordScreen && !window.navigator.mediaDevices.getDisplayMedia) {
      throw new ReferenceError('This browser does not support screen capturing');
    }

    if (isObject(mediaStreamConstraints.video)) {
      validateMediaTrackConstraints(mediaStreamConstraints.video);
    }

    if (isObject(mediaStreamConstraints.audio)) {
      validateMediaTrackConstraints(mediaStreamConstraints.audio);
    }

    if (mediaRecorderOptions && mediaRecorderOptions.mimeType) {
      if (!MediaRecorder.isTypeSupported(mediaRecorderOptions.mimeType)) {
        console.error(`The specified MIME type supplied to MediaRecorder is not supported by this browser.`);
      }
    }
  }, [mediaStreamConstraints, mediaRecorderOptions, recordScreen]);

  return {
    error,
    status,
    mediaBlob,
    isAudioMuted,
    stopRecording,
    getMediaStream,
    startRecording,
    pauseRecording,
    resumeRecording,
    clearMediaStream,
    muteAudio: () => muteAudio(true),
    unMuteAudio: () => muteAudio(false),
    get liveStream() {
      if (mediaStream.current) {
        return new MediaStream(mediaStream.current.getVideoTracks());
      }
      return null;
    },
  };
}

function LiveStreamPreview({ stream }) {
  let videoPreviewRef = React.useRef();

  React.useEffect(() => {
    if (videoPreviewRef.current && stream) {
      videoPreviewRef.current.srcObject = stream;
    }
  }, [stream]);

  if (!stream) {
    return null;
  }

  return <video ref={videoPreviewRef} width={520} height={480} autoPlay />;
}

function Player({ srcBlob }) {
  if (!srcBlob) {
    return null;
  }

  return <video src={URL.createObjectURL(srcBlob)} width={520} height={480} controls />;
}

const VideoRecorder = (props: any) => {
  let [recordScreen, setRecordScreen] = React.useState(true);
  let [audio, setAudio] = React.useState(false);
  let {
    status,
    liveStream,
    mediaBlob,
    pauseRecording,
    resumeRecording,
    stopRecording,
    getMediaStream,
    startRecording,
    clearMediaStream,
  } = useMediaRecorder({
    recordScreen,
    mediaStreamConstraints: { audio, video: true },
  });

  const [blob, setBlob] = React.useState();

  const db = useIndexedDB('social');
  const { getAll } = useIndexedDB('social');

  //eslint-disable-next-line
  React.useEffect(() => {
    clearMediaStream();

    async function getBlobs() {
      const items = await getAll();
      setBlob(items[0]?.blob);

      // get hours
      console.log('hours', (new Date().getTime() - items?.[0]?.created_at) / 1000 / 60 / 60);

      console.log(items);
    }

    getBlobs();
  }, []);

  return (
    <>
      {/* <article> */}
      {/* <h1>Video recorder</h1>
      {status} */}
      <dialog open={status === 'acquiring_media'}>Waiting for permissions</dialog>
      <section>
        {status !== 'recording' && (
          <button
            type="button"
            onClick={async () => {
              await getMediaStream();
              startRecording();
            }}
          >
            Start recording
          </button>
        )}
        {status === 'recording' && (
          <button type="button" onClick={pauseRecording}>
            Pause recording
          </button>
        )}
        {status === 'paused' && (
          <button type="button" onClick={resumeRecording}>
            Resume recording
          </button>
        )}
        {status === 'recording' && (
          <button type="button" onClick={stopRecording}>
            Stop recording
          </button>
        )}
      </section>
      {/* <LiveStreamPreview stream={liveStream} /> */}
      {/* <Player srcBlob={blob ?? mediaBlob} /> */}
      {/* </article> */}
    </>
  );
};

export default VideoRecorder;
