import { css } from '@emotion/css';
import React, { FC, ReactElement, useState } from 'react';

import { selectors } from '@grafana/e2e-selectors';
import { config, getBackendSrv } from '@grafana/runtime';
import { Button, Form, Input, Field } from '@grafana/ui';

import { PasswordField } from '../PasswordField/PasswordField';

import { FormModel } from './LoginCtrl';
import { bufferDecode, bufferEncode } from './webauth';

interface Props {
  children: ReactElement;
  onSubmit: (data: FormModel) => void;
  isLoggingIn: boolean;
  passwordHint: string;
  loginHint: string;
}

const wrapperStyles = css`
  width: 100%;
  padding-bottom: 16px;
`;

export const submitButton = css`
  justify-content: center;
  width: 100%;
`;

export const NewLoginForm: FC<Props> = ({ children, onSubmit, isLoggingIn, passwordHint, loginHint }) => {
  const [showPasswordForm, setShowPasswordForm] = useState(false);

  const checkForCredentials = async (data: FormModel) => {
    if (showPasswordForm) {
      onSubmit(data);
      return;
    }

    try {
      const credentialRequestOptions = await getBackendSrv().get(`/api/webauthn/credentials/${data.user}`);

      // if 404, then show password field, maybe "slide down" to reveal or something

      // if we DO get a response with the credential IDs then call
      credentialRequestOptions.publicKey.challenge = bufferDecode(credentialRequestOptions.publicKey.challenge);
      credentialRequestOptions.publicKey.allowCredentials.forEach((cred: any) => {
        cred.id = bufferDecode(cred.id);
      });
      // credentialRequestOptions.publicKey.userVerification = 'discouraged';
      // credentialRequestOptions.publicKey.allowCredentials[0].transports = ['internal'];
      const assertion = await navigator.credentials.get({
        publicKey: credentialRequestOptions.publicKey,
      });

      if (
        !(assertion instanceof PublicKeyCredential) ||
        !(assertion.response instanceof AuthenticatorAssertionResponse)
      ) {
        return;
      }

      let authData = assertion.response.authenticatorData;
      let clientDataJSON = assertion.response.clientDataJSON;
      let rawId = assertion.rawId;
      let sig = assertion.response.signature;
      let userHandle = assertion.response.userHandle;

      const response = await getBackendSrv().post(`/api/webauthn/login/${data.user}`, {
        id: assertion.id,
        rawId: bufferEncode(rawId),
        type: assertion.type,
        response: {
          authenticatorData: bufferEncode(authData),
          clientDataJSON: bufferEncode(clientDataJSON),
          signature: bufferEncode(sig),
          userHandle: userHandle && bufferEncode(userHandle),
        },
      });

      if (response.redirectUrl) {
        if (config.appSubUrl !== '' && !response.redirectUrl.startsWith(config.appSubUrl)) {
          window.location.assign(config.appSubUrl + response.redirectUrl);
        } else {
          window.location.assign(response.redirectUrl);
        }
      } else {
        window.location.assign(config.appSubUrl + '/');
      }
    } catch (err) {
      setShowPasswordForm(true);
    }
  };

  return (
    <div className={wrapperStyles}>
      <Form onSubmit={checkForCredentials} validateOn="onChange">
        {({ register, errors }) => (
          <>
            <Field label="Email or username" invalid={!!errors.user} error={errors.user?.message}>
              <Input
                {...register('user', { required: 'Email or username is required' })}
                autoFocus
                autoCapitalize="none"
                placeholder={loginHint}
                autoComplete="username"
                aria-label={selectors.pages.Login.username}
              />
            </Field>
            {showPasswordForm && (
              <Field label="Password" invalid={!!errors.password} error={errors.password?.message}>
                <PasswordField
                  id="current-password"
                  autoComplete="current-password"
                  passwordHint={passwordHint}
                  {...register('password', { required: 'Password is required' })}
                />
              </Field>
            )}
            <Button
              type="submit"
              aria-label={selectors.pages.Login.submit}
              className={submitButton}
              disabled={isLoggingIn}
            >
              {isLoggingIn ? 'Logging in...' : 'Log in'}
            </Button>
            {children}
          </>
        )}
      </Form>
    </div>
  );
};
