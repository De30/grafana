import { FormEvent } from 'react';

import { NavModelItem, NewThemeOptions } from '@grafana/data';
import { getBackendSrv } from '@grafana/runtime';
import { StateManagerBase } from 'app/core/services/StateManagerBase';

import { setRuntimeTheme } from './changeTheme';

export interface CustomTheme {
  uid: string;
  name: string;
  body: NewThemeOptions;
}

export enum CustomThemeType {
  Interface = 'interface',
  Dashboard = 'dashboard',
}

export function loadAllThemes(): Promise<CustomTheme[]> {
  return getBackendSrv().get(`/api/themes`);
}

export interface EditThemeState {
  theme: CustomTheme;
  code: string;
  loading: boolean;
}

export class ThemeEditPageState extends StateManagerBase<EditThemeState> {
  constructor() {
    super({
      theme: {
        uid: 'new',
        name: 'New theme',
        body: {},
      },
      loading: true,
      code: `{        
      }`,
    });
  }

  async loadTheme(uid: string) {
    if (uid === 'new') {
      this.setState({ loading: false });
    } else {
      const result = await getBackendSrv().get(`/api/themes/${uid}`);

      this.setState({
        theme: result,
        loading: false,
        code: JSON.stringify(result.body, null, 2),
      });

      setRuntimeTheme(this.state.theme);
    }
  }

  getPageNav(): NavModelItem {
    if (this.state.loading) {
      return { text: 'Loading' };
    }

    return {
      text: this.state.theme.name,
      subTitle: 'Edit and preview theme properties',
    };
  }

  onSave = async () => {
    const { theme } = this.state;

    if (theme.uid === 'new') {
      const result = await getBackendSrv().post('/api/themes', theme);
      this.setState({ theme: result });
    } else {
      const result = await getBackendSrv().put(`/api/themes/${theme.uid}`, theme);
      this.setState({ theme: result });
    }
  };

  onNameChange = (evt: FormEvent<HTMLInputElement>) => {
    this.setState({
      theme: {
        ...this.state.theme,
        name: evt.currentTarget.value,
      },
    });
  };

  onCodeBlur = (code: string) => {
    this.setState({
      theme: { ...this.state.theme, body: JSON.parse(code) },
      code,
    });

    setRuntimeTheme(this.state.theme);
  };
}

let editState: ThemeEditPageState | null = null;

export function getThemeEditStateManager() {
  if (!editState) {
    editState = new ThemeEditPageState();
  }
  return editState;
}
