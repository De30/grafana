import React, { useState } from 'react';
import { css } from '@emotion/css';
import ReactConsole from '@webscopeio/react-console';
import { GrafanaTheme2 } from '@grafana/data';
import { useStyles2 } from '@grafana/ui';

export const Console = () => {
  const styles = useStyles2(getStyles);
  const [history, setHistory] = useState(['test']);

  return (
    <div>
      <ReactConsole
        wrapperClassName={styles.consoleContainer}
        lineClassName={styles.responseContainer}
        autoFocus
        prompt={'root@raspberrypi: /home/pi#'}
        welcomeMessage={`Linux raspberrypi 3.12.34+ #1 PREEMPT Sun Dec 7 22:39:06 CET 2014 army61
The programs included with the Debian GNU/Linux system are free software; the exact distribution terms for each program are described in the individual files in /usr/share/doc/*/ copyright.
Debian GNU/Linux comes with ABSOLUTELY NO WARRANTY, to the extent permitted by applicable law. Last login: Tue Feb 3 08:25:14 2015 from 10.0.0.38`}
        history={history}
        onAddHistoryItem={(newEntry) => {
          setHistory([...history, newEntry]);
        }}
        commands={{
          history: {
            description: 'History',
            fn: () =>
              new Promise((resolve) => {
                resolve(`${history.join('\r\n')}`);
              }),
          },
          echo: {
            description: 'Echo',
            fn: (...args) => {
              return new Promise((resolve, reject) => {
                setTimeout(() => {
                  resolve(`${args.join(' ')}`);
                }, 0);
              });
            },
          },
          sleep: {
            description: 'sleep',
            fn: (timeout) => {
              return new Promise((resolve, reject) => {
                setTimeout(() => {
                  resolve('');
                }, timeout);
              });
            },
          },
        }}
        noCommandFound={() =>
          new Promise((resolve, reject) => {
            resolve('No command found');
          })
        }
      />
    </div>
  );
};

const getStyles = (theme: GrafanaTheme2) => ({
  consoleContainer: css`
    margin: 40px;
    width: 600px;
  `,
  responseContainer: css`
    border: none;
  `,
});
