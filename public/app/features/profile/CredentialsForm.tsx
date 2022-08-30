import { css } from '@emotion/css';
import { parseISO, format } from 'date-fns';
import React, { useCallback, useState } from 'react';

import { GrafanaTheme2 } from '@grafana/data';
import { getBackendSrv } from '@grafana/runtime';
import { Button, ButtonProps, HorizontalGroup, Icon, Input, Spinner, useStyles2 } from '@grafana/ui';
import { bufferDecode, bufferEncode } from 'app/core/components/Login/webauth';
import { useAppNotification } from 'app/core/copy/appNotification';
import { useDispatch, useSelector } from 'app/types';

import { setCredentials } from './state/reducers';

interface Props {}

export function CredentialsForm({}: Props) {
  const credentials = useSelector((state) => state.user.user?.credentials ?? []);
  const dispatch = useDispatch();
  const notifyApp = useAppNotification();

  const deleteCredential = async (id: number) => {
    await getBackendSrv().delete(`/api/user/credentials/${id}`);
    dispatch(setCredentials(credentials.filter((c) => c.id !== id)));
  };

  const [loading, register] = useCredentials();
  const registerCredential = async (credentialName: string) => {
    try {
      const newCred = await register(credentialName);
      dispatch(setCredentials([...credentials, newCred]));
    } catch (err) {
      notifyApp.error('Error registering credential. See console for details.');
      console.error(err);
    }
  };

  const styles = useStyles2(getStyles);
  return (
    <div className={styles.container}>
      <h4>Credentials</h4>
      <div className={styles.credGrid}>
        {credentials.map((cred) => (
          <React.Fragment key={cred.id}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <Icon name="key-skeleton-alt" />
              <strong>{cred.name}</strong> &mdash; registered on {format(parseISO(cred.createdAt), 'MMM d, y')}
            </div>
            <Button variant="destructive" onClick={() => deleteCredential(cred.id)}>
              Delete
            </Button>
          </React.Fragment>
        ))}
      </div>
      <InputButton
        variant="secondary"
        onClick={registerCredential}
        disabled={loading}
        label="Register a new credential"
        activeLabel="Add"
      />
      {loading && (
        <div className={styles.spinWrapper}>
          <Spinner inline />
          <span className={styles.smallText}>Registering new credential...</span>
        </div>
      )}
    </div>
  );
}

interface InputButtonProps extends Omit<ButtonProps, 'onChange' | 'onClick' | 'children'> {
  onClick?: (inputValue: string) => Promise<void>;
  label: string;
  activeLabel?: string;
}

export function InputButton({ label, activeLabel, onClick, placeholder, disabled }: InputButtonProps) {
  const [inputVisible, setInputVisible] = useState(false);
  const [text, setText] = useState('');

  const onChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setText(e.target.value);
  };

  const onButtonClick = async (e: React.MouseEvent<HTMLButtonElement>) => {
    if (!inputVisible) {
      setInputVisible(true);
      return;
    }

    try {
      await onClick?.(text);
      setText('');
      setInputVisible(false);
    } catch {}
  };

  return (
    <HorizontalGroup>
      {inputVisible && (
        <Input placeholder={placeholder} onChange={onChange} disabled={disabled} value={text} autoFocus />
      )}
      <Button onClick={onButtonClick} disabled={disabled || (inputVisible && !text)}>
        {(inputVisible ? activeLabel : label) ?? label}
      </Button>
    </HorizontalGroup>
  );
}

function useCredentials(): [boolean, (a: string) => Promise<{ id: number; name: string; createdAt: string }>] {
  const [loading, setLoading] = useState(false);
  // Request options from server, request authentication from user, then send result back to server and wait for the OK
  const requestCredential = useCallback(async (credentialName: string) => {
    try {
      setLoading(true);
      const credentialCreationOptions = await getBackendSrv().get('/api/user/credentials/options');
      credentialCreationOptions.publicKey.challenge = bufferDecode(credentialCreationOptions.publicKey.challenge);
      credentialCreationOptions.publicKey.user.id = bufferDecode(credentialCreationOptions.publicKey.user.id);
      if (credentialCreationOptions.publicKey.excludeCredentials) {
        for (const excluded of credentialCreationOptions.publicKey.excludeCredentials) {
          excluded.id = bufferDecode(excluded.id);
        }
      }

      const credential = await navigator.credentials.create(credentialCreationOptions);
      if (
        !(credential instanceof PublicKeyCredential) ||
        !(credential.response instanceof AuthenticatorAttestationResponse)
      ) {
        throw new Error('browser does not support public key credentials');
      }

      const newCred: { name: string; id: number; createdAt: string } = await getBackendSrv().post(
        `/api/user/credentials`,
        {
          credential: {
            name: credentialName,
            id: credential.id,
            rawId: bufferEncode(credential.rawId),
            type: credential.type,
            response: {
              attestationObject: bufferEncode(credential.response.attestationObject),
              clientDataJSON: bufferEncode(credential.response.clientDataJSON),
            },
          },
        }
      );
      return newCred;
    } finally {
      setLoading(false);
    }
  }, []);

  return [loading, requestCredential];
}

function getStyles(theme: GrafanaTheme2) {
  return {
    list: css({
      listStyle: 'none',
      display: 'flex',
      li: {
        display: 'flex',
        columnGap: theme.spacing(1),
        alignItems: 'center',
      },
    }),
    container: css({
      display: 'flex',
      flexDirection: 'column',
      rowGap: theme.spacing(1),
    }),
    credGrid: css({
      display: 'grid',
      gridTemplateColumns: 'max-content min-content',
      columnGap: theme.spacing(2),
      rowGap: theme.spacing(1),
      alignItems: 'center',
    }),
    smallText: css({
      color: theme.colors.text.secondary,
    }),
    spinWrapper: css({
      display: 'flex',
      flexDirection: 'column',
      width: 'fit-content',
      alignItems: 'center',
    }),
  };
}
