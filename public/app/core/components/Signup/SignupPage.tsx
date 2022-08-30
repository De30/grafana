import { css } from '@emotion/css';
import React, { FC, useCallback, useState } from 'react';
import { useAsyncFn } from 'react-use';

import { GrafanaTheme2 } from '@grafana/data';
import { getBackendSrv } from '@grafana/runtime';
import {
  Form,
  Field,
  Input,
  Button,
  HorizontalGroup,
  LinkButton,
  FormAPI,
  useStyles2,
  VerticalGroup,
  Icon,
} from '@grafana/ui';
import { getConfig } from 'app/core/config';
import { useAppNotification } from 'app/core/copy/appNotification';
import { GrafanaRouteComponentProps } from 'app/core/navigation/types';
import { InputButton } from 'app/features/profile/CredentialsForm';

import { InnerBox, LoginLayout } from '../Login/LoginLayout';
import { bufferDecode, bufferEncode } from '../Login/webauth';
import { PasswordField } from '../PasswordField/PasswordField';

// declare global {
//   interface AuthenticatorAttestationResponse {
//     getTransports(): 'usb' | 'nfc' | 'ble' | 'hybrid' | 'internal';
//   }
// }

interface SignupDTO {
  name?: string;
  email: string;
  username: string;
  orgName?: string;
  password: string;
  code: string;
  confirm?: string;
}

// interface CollectedClientData {
//   type: string;
//   challenge: string;
//   origin: string;
//   crossOrigin?: boolean;
// }

interface QueryParams {
  email?: string;
  code?: string;
}

interface Props extends GrafanaRouteComponentProps<{}, QueryParams> {}

function isCredential(cred: any): cred is PublicKeyCredential & { response: AuthenticatorAttestationResponse } {
  return 'rawId' in cred && 'response' in cred && 'attestationObject' in cred.response;
}

interface GrafanaCredential extends PublicKeyCredential {
  credentialName: string;
  response: AuthenticatorAttestationResponse;
}

export const SignupPage: FC<Props> = (props) => {
  const notifyApp = useAppNotification();
  const styles = useStyles2(getStyles);
  const [credentials, setCredentials] = useState<GrafanaCredential[]>([]);
  const [state, fetchCreationOptions] = useAsyncFn(async (email: string, name: string) => {
    const credentialCreationOptions = await getBackendSrv().post('api/user/signup/webauthn/options', { email, name });
    credentialCreationOptions.publicKey.challenge = bufferDecode(credentialCreationOptions.publicKey.challenge);
    credentialCreationOptions.publicKey.user.id = bufferDecode(credentialCreationOptions.publicKey.user.id);
    if (credentialCreationOptions.publicKey.excludeCredentials) {
      for (const excluded of credentialCreationOptions.publicKey.excludeCredentials) {
        excluded.id = bufferDecode(excluded.id);
      }
    }

    return credentialCreationOptions;
  }, []);

  const addNewCredential = useCallback(
    async (email: string, credName: string, name = '') => {
      const creationOptions = state.value && !state.error ? state.value : await fetchCreationOptions(email, name);

      // Exclude any already-registered credentials so we can't register a credential twice
      if (credentials.length > 0) {
        creationOptions.publicKey.excludeCredentials ??= [];
        creationOptions.publicKey.excludeCredentials.push(
          ...credentials.map((c) => ({
            id: c.rawId,
            type: c.type,
          }))
        );
      }

      const publicKeyOptions: PublicKeyCredentialCreationOptions = creationOptions.publicKey;
      const credential = await navigator.credentials.create({
        publicKey: publicKeyOptions,
      });

      if (!isCredential(credential)) {
        return;
      }

      setCredentials([
        ...credentials,
        {
          id: credential.id,
          rawId: credential.rawId,
          type: credential.type,
          response: credential.response,
          getClientExtensionResults: credential.getClientExtensionResults,
          credentialName: credName,
        },
      ]);
    },
    [fetchCreationOptions, state, credentials]
  );

  const onSubmit = async (formData: SignupDTO) => {
    if (formData.name === '') {
      delete formData.name;
    }
    delete formData.confirm;

    if (formData.password || credentials.length <= 0) {
      return;
    }

    // Using webauth
    const response = await getBackendSrv()
      .post('/api/user/signup/webauthn/signup', {
        name: formData.name,
        email: formData.email,
        credentialList: credentials.map((c) => {
          let attestationObject = c.response.attestationObject;
          let clientDataJSON = c.response.clientDataJSON;
          let rawId = c.rawId;

          return {
            id: c.id,
            name: c.credentialName,
            rawId: bufferEncode(rawId),
            type: c.type,
            response: {
              attestationObject: bufferEncode(attestationObject),
              clientDataJSON: bufferEncode(clientDataJSON),
            },
          };
        }),
      })
      .catch((err) => {
        const msg = err.data?.message || err;
        notifyApp.warning(msg);
      });

    if (response.code === 'redirect-to-select-org') {
      window.location.assign(getConfig().appSubUrl + '/profile/select-org?signup=1');
    }
    window.location.assign(getConfig().appSubUrl + '/');

    // const response = await getBackendSrv()
    //   .post('/api/user/signup/step2', {
    //     email: formData.email,
    //     code: formData.code,
    //     username: formData.email,
    //     orgName: formData.orgName,
    //     password: formData.password,
    //     name: formData.name,
    //   })
    //   .catch((err) => {
    //     const msg = err.data?.message || err;
    //     notifyApp.warning(msg);
    //   });
  };

  const defaultValues = {
    email: props.queryParams.email,
    code: props.queryParams.code,
  };

  const deleteCredential = (c: GrafanaCredential) => {
    setCredentials(credentials.filter((cred) => cred.id !== c.id));
  };

  return (
    <LoginLayout>
      <InnerBox>
        <Form defaultValues={defaultValues} onSubmit={onSubmit}>
          {({ errors, register, getValues }: FormAPI<SignupDTO>) => (
            <>
              <Field label="Your name">
                <Input id="user-name" {...register('name')} placeholder="(optional)" />
              </Field>
              <Field label="Email" invalid={!!errors.email} error={errors.email?.message}>
                <Input
                  id="email"
                  {...register('email', {
                    required: 'Email is required',
                    pattern: {
                      value: /^\S+@\S+$/,
                      message: 'Email is invalid',
                    },
                  })}
                  type="email"
                  autoComplete="email"
                  placeholder="Email"
                />
              </Field>
              {!getConfig().autoAssignOrg && (
                <Field label="Org. name">
                  <Input id="org-name" {...register('orgName')} placeholder="Org. name" />
                </Field>
              )}
              {getConfig().verifyEmailEnabled && (
                <Field label="Email verification code (sent to your email)">
                  <Input id="verification-code" {...register('code')} placeholder="Code" />
                </Field>
              )}
              <Field
                label="Password"
                invalid={!!errors.password && credentials.length <= 0}
                error={errors?.password?.message}
              >
                <PasswordField id="new-password" autoFocus autoComplete="new-password" {...register('password')} />
              </Field>
              <Field
                label="Confirm password"
                invalid={!!errors.confirm && credentials.length <= 0}
                error={errors?.confirm?.message}
              >
                <PasswordField id="confirm-new-password" autoComplete="new-password" {...register('confirm')} />
              </Field>
              {getConfig().webAuthnEnabled && (
                <Field label="Credentials (Optional)">
                  <VerticalGroup>
                    <div className={styles.credGrid}>
                      {credentials.map((cred) => (
                        <React.Fragment key={cred.id}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                            <Icon name="key-skeleton-alt" />
                            <strong>{cred.credentialName}</strong>
                          </div>
                          <Button variant="destructive" onClick={() => deleteCredential(cred)}>
                            Delete
                          </Button>
                        </React.Fragment>
                      ))}
                    </div>

                    <HorizontalGroup>
                      <InputButton
                        variant="secondary"
                        onClick={(credName) => addNewCredential(getValues().email, credName, getValues().name)}
                        label="Register a new credential"
                        activeLabel="Add"
                      />
                    </HorizontalGroup>
                  </VerticalGroup>
                </Field>
              )}
              <HorizontalGroup>
                <Button type="submit">Submit</Button>
                <LinkButton fill="text" href={getConfig().appSubUrl + '/login'}>
                  Back to login
                </LinkButton>
              </HorizontalGroup>
            </>
          )}
        </Form>
      </InnerBox>
    </LoginLayout>
  );
};

function getStyles(theme: GrafanaTheme2) {
  return {
    addCredential: css({
      aspectRatio: '1/1',
      padding: '0px',
      justifyContent: 'center',
      height: theme.spacing(4),
    }),
    credGrid: css({
      display: 'grid',
      gridTemplateColumns: 'max-content min-content',
      columnGap: theme.spacing(2),
      rowGap: theme.spacing(1),
      alignItems: 'center',
    }),
  };
}

export default SignupPage;
