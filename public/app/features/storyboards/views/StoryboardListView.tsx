import React, { useRef, useCallback, MutableRefObject, useEffect, useState } from 'react';
import { Page } from 'app/core/components/Page/Page';
import { useNavModel } from 'app/core/hooks/useNavModel';

import type {
  ContentUpdateMessage,
  InboundNotebookMessage,
  OutboundNotebookMessage,
  ReadySignalMessage,
  SaveMessage,
} from 'starboard-notebook';

export type StarboardNotebookIFrameOptions<ReceivedMessageType = OutboundNotebookMessage> = {
  src: string;
  autoResize: boolean;
  baseUrl?: string;
  notebookContent?: Promise<string> | string;
  onNotebookReadySignalMessage(payload: ReadySignalMessage['payload']): void;
  onSaveMessage(payload: SaveMessage['payload']): void | boolean | Promise<boolean>;
  onContentUpdateMessage(payload: ContentUpdateMessage['payload']): void;
  onMessage(message: ReceivedMessageType): void;
  onUnsavedChangesStatusChange(hasUnsavedChanges: boolean): void;
  sandbox: string;
  preventNavigationWithUnsavedChanges: boolean;
};

interface StarboardNotebookMessageSignalReady {
  type: 'SIGNAL_READY';
}

interface StarboardNotebookMessageSetNotebookContent {
  type: 'SET_NOTEBOOK_CONTENT';
}

interface StarboardNotebookMessageNotebookContentUpdate {
  type: 'NOTEBOOK_CONTENT_UPDATE';
}

interface StarboardNotebookMessageSave {
  type: 'SAVE';
}

export type StarboardNotebookMessage =
  | StarboardNotebookMessageSignalReady
  | StarboardNotebookMessageSetNotebookContent
  | StarboardNotebookMessageNotebookContentUpdate
  | StarboardNotebookMessageSave;

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

function useStarboard(initialOptions: Partial<StarboardNotebookIFrameOptions>) {
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
      console.debug(' * send message %o', message);
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

      console.debug('Got Message %s: %o', msg.type, msg);

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
    console.debug(' * set up iframe message handler');
    window.addEventListener('message', iframeMessageHandler);
    return () => {
      console.debug(' * remove iframe message handler');
      window.removeEventListener('message', iframeMessageHandler);
    };
  }, [iframeMessageHandler]);

  return { iframeRef, options, contentRef, sendMessage, setSaved };
}

export const StoryboardListView = () => {
  const navModel = useNavModel('storyboards');
  const [loaded, setLoaded] = useState(false);
  const { iframeRef, contentRef, sendMessage } = useStarboard({});

  useEffect(() => {
    if (!loaded) {
      return;
    }
    console.debug('* Sending init data');
    sendMessage({
      type: 'NOTEBOOK_SET_INIT_DATA',
      payload: {
        content: `# %% [markdown]
### More info
We can do javascript:
# %% [javascript]
console.log('Hello world!')
# %% [markdown]
We can do python:
# %% [python]
print("hi, from python")
# %% [markdown]
Math should be no issue:
# %% [latex]
\\begin{equation}
\\begin{aligned}
\\frac{\\partial\\mathcal{D}}{\\partial t} \\quad & = \\quad \\nabla\\times\\mathcal{H},   & \\quad \\text{(Loi de Faraday)} \\\\[5pt]
\\frac{\\partial\\mathcal{B}}{\\partial t} \\quad & = \\quad -\\nabla\\times\\mathcal{E},  & \\quad \\text{(Loi d'Ampère)}   \\\\[5pt]
\\nabla\\cdot\\mathcal{B}                 \\quad & = \\quad 0,                         & \\quad \\text{(Loi de Gauss)}  \\\\[5pt]
\\nabla\\cdot\\mathcal{D}                 \\quad & = \\quad 0.                         & \\quad \\text{(Loi de Colomb)}
\\end{aligned}
\\end{equation}`,
      },
    });
  }, [loaded, sendMessage]);

  return (
    <Page navModel={navModel}>
      <Page.Contents>
        <iframe
          onLoad={(e) => {
            console.debug('* did load', e);
            setLoaded(true);
          }}
          ref={iframeRef}
          src="https://unpkg.com/starboard-notebook@0.12.0/dist/index.html"
          style={{ width: '100%', minHeight: '100vh' }}
        ></iframe>
        <div ref={contentRef}></div>
      </Page.Contents>
    </Page>
  );
};

export default StoryboardListView;
