import { MutableRefObject, useRef, useCallback, useEffect, useState, useMemo } from 'react';
import { createQueryRunner } from '@grafana/runtime';
import { createStoryboard, getStoryboards, removeStoryboard, updateStoryboard } from './storage';
import { InboundNotebookMessage, OutboundNotebookMessage, StarboardNotebookIFrameOptions, Storyboard } from './types';

function loadDefaultSettings(
  opts: Partial<StarboardNotebookIFrameOptions>,
  elRef: MutableRefObject<HTMLIFrameElement | null>
): StarboardNotebookIFrameOptions | null {
  const el = elRef.current;
  if (el == null) {
    return null;
  }
  return {
    src:
      opts.src ??
      el.getAttribute('src') ??
      (window as any).starboardEmbedIFrameSrc ??
      'https://unpkg.com/starboard-notebook@0.12.0/dist/index.html',
    baseUrl: opts.baseUrl || el.dataset['baseUrl'] || undefined,
    autoResize: opts.autoResize ?? true,
    sandbox:
      opts.sandbox ??
      el.getAttribute('sandbox') ??
      'allow-scripts allow-modals allow-same-origin allow-pointer-lock allow-top-navigation-by-user-activation allow-forms allow-downloads',
    onNotebookReadySignalMessage: opts.onNotebookReadySignalMessage ?? function () {},
    onContentUpdateMessage: opts.onContentUpdateMessage ?? function () {},
    onSaveMessage: opts.onSaveMessage ?? function () {},
    onMessage: opts.onMessage ?? function () {},
    onUnsavedChangesStatusChange: opts.onUnsavedChangesStatusChange ?? function () {},
    notebookContent: opts.notebookContent,
    preventNavigationWithUnsavedChanges: opts.preventNavigationWithUnsavedChanges ?? false,
  };
}

export function useStarboard(initialOptions: Partial<StarboardNotebookIFrameOptions>) {
  const iframeRef = useRef<HTMLIFrameElement | null>(null);
  const contentRef = useRef<HTMLDivElement | null>(null);
  const options = useRef<StarboardNotebookIFrameOptions | null>(loadDefaultSettings(initialOptions, iframeRef));
  options.current = loadDefaultSettings(initialOptions, iframeRef);

  const notebookContent = useRef('');
  const lastSavedNotebookContent = useRef('');
  const dirty = useRef(false);

  const updateDirty = useCallback(() => {
    const priorDirtyState = dirty.current;
    dirty.current = lastSavedNotebookContent.current !== notebookContent.current;

    if (dirty.current !== priorDirtyState) {
      options.current?.onUnsavedChangesStatusChange(dirty.current);
    }
  }, [dirty, options]);

  const setSaved = useCallback(
    (content?: string) => {
      let toSave = content ?? notebookContent.current;
      lastSavedNotebookContent.current = toSave;
      updateDirty();
    },
    [updateDirty]
  );

  const sendMessage = useCallback(
    (message: InboundNotebookMessage) => {
      // Sending messages before the iframe leads to messages being lost, which can happen when the iframe loads slowly.
      if (iframeRef.current == null) {
        throw new Error('Not set up yet');
      }
      console.info(' * send message %o', message);
      iframeRef.current.contentWindow?.postMessage(message, '*');
    },
    [iframeRef]
  );

  const iframeMessageHandler = useCallback(
    async (ev: MessageEvent<InboundNotebookMessage | OutboundNotebookMessage>) => {
      if (ev.source === null || ev.source !== iframeRef.current?.contentWindow) {
        return;
      }

      if (options.current == null) {
        return;
      }

      const checkOrigin = [new URL(options.current.src, location.origin).origin];
      if (!checkOrigin.includes(ev.origin)) {
        return;
      }

      if (ev.data == null) {
        return;
      }

      const msg = ev.data as OutboundNotebookMessage;
      const iFrame = iframeRef.current;

      console.info('Got Message %s: %o', msg.type, msg.payload);

      switch (msg.type) {
        case 'NOTEBOOK_RESIZE_REQUEST': {
          if (options.current.autoResize && iFrame) {
            iFrame.setAttribute('scrolling', 'no');
            // Todo: make the width super stable as well
            // iFrame.style.width = `${ev.data.payload.width}px`;
            iFrame.style.height = `${(ev.data as any).payload.height + 2}px`; // Not sure why I need + 2
          }
          break;
        }

        case 'NOTEBOOK_READY_REQUEST': {
          if (options.current.notebookContent) {
            const content = await options.current.notebookContent;
            lastSavedNotebookContent.current = notebookContent.current = content;

            sendMessage({
              type: 'NOTEBOOK_SET_INIT_DATA',
              payload: { content, baseUrl: options.current.baseUrl },
            });
          } else {
            lastSavedNotebookContent.current = notebookContent.current = msg.payload.content;
          }
          options.current.onNotebookReadySignalMessage(msg.payload);
          break;
        }

        case 'NOTEBOOK_CONTENT_UPDATE': {
          notebookContent.current = msg.payload.content;
          updateDirty();
          options.current.onContentUpdateMessage(msg.payload);
          break;
        }

        case 'NOTEBOOK_SAVE_REQUEST': {
          notebookContent.current = msg.payload.content;
          updateDirty();
          // Make it a promise regardless of return value of the function.
          const r = Promise.resolve(options.current.onSaveMessage(msg.payload));
          r.then((ret) => {
            if (ret === true) {
              lastSavedNotebookContent.current = msg.payload.content;
              updateDirty();
            }
          });
          break;
        }
      }

      options.current.onMessage(msg);
    },
    [options, sendMessage, updateDirty]
  );

  useEffect(() => {
    console.info(' * set up iframe message handler');
    window.addEventListener('message', iframeMessageHandler);
    return () => {
      console.info(' * remove iframe message handler');
      window.removeEventListener('message', iframeMessageHandler);
    };
  }, [iframeMessageHandler]);

  return { iframeRef, options, contentRef, sendMessage, setSaved };
}

export function useSavedStoryboards() {
  let [boards, setBoards] = useState<Storyboard[]>(getStoryboards());

  const updateBoardState = () => {
    const newBoards = getStoryboards();
    setBoards(newBoards);
  };

  const updateBoard = (board: Storyboard) => {
    updateStoryboard(board);
    updateBoardState();
  };

  const removeBoard = (boardId: string) => {
    removeStoryboard(boardId);
    updateBoardState();
  };

  const createBoard = (board: Storyboard) => {
    createStoryboard(board);
    updateBoardState();
  };

  return { boards, updateBoard, createBoard, removeBoard };
}

export function useRunner() {
  const runner = useMemo(() => createQueryRunner(), []);

  useEffect(() => {
    const toDestroy = runner;
    return () => {
      return toDestroy.destroy();
    };
  }, [runner]);

  return runner;
}
