import { FormEvent } from 'react';

import { AppEvents, GrafanaTheme2, NavModelItem, NewThemeOptions } from '@grafana/data';
import { config, getBackendSrv, locationService } from '@grafana/runtime';
import appEvents from 'app/core/app_events';
import { StateManagerBase } from 'app/core/services/StateManagerBase';

import { setRuntimeTheme } from './changeTheme';

export interface CustomThemeDTO {
  uid: string;
  name: string;
  description: string;
  body: NewThemeOptions;
}

export enum CustomThemeType {
  Interface = 'interface',
  Dashboard = 'dashboard',
}

export async function loadAllThemes(): Promise<CustomThemeDTO[]> {
  const result = await getBackendSrv().get<CustomThemeDTO[]>(`/api/themes`);
  result.sort((a, b) => a.name.localeCompare(b.name));
  return result;
}

export interface EditThemeState {
  theme: CustomThemeDTO;
  defJson: string;
  fullJson: string;
  loading: boolean;
  tab: string;
  safeMode?: boolean;
}

const defaultState: EditThemeState = {
  theme: {
    uid: 'new',
    name: 'New theme',
    body: {},
    description: '',
  },
  loading: true,
  tab: 'def',
  defJson: `{        
  }`,
  fullJson: '',
};

export class ThemeEditPageState extends StateManagerBase<EditThemeState> {
  constructor() {
    super(defaultState);
  }

  async loadTheme(uid: string, safeMode?: boolean) {
    if (uid === 'new') {
      this.setState({
        ...defaultState,
        loading: false,
        safeMode,
      });
    } else {
      const customTheme = await getBackendSrv().get<CustomThemeDTO>(`/api/themes/${uid}`);
      let runtimeTheme = config.theme2;

      runtimeTheme = setRuntimeTheme(customTheme, safeMode);

      this.setState({
        ...defaultState,
        theme: customTheme,
        loading: false,
        defJson: JSON.stringify(customTheme.body, null, 2),
        fullJson: this.getFullJson(runtimeTheme),
        safeMode,
      });
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
      appEvents.emit(AppEvents.alertSuccess, ['Theme created']);
    } else {
      const result = await getBackendSrv().put(`/api/themes/${theme.uid}`, theme);
      this.setState({ theme: result });
      appEvents.emit(AppEvents.alertSuccess, ['Theme saved']);
    }
  };

  onDelete = async () => {
    await getBackendSrv().delete(`/api/themes/${this.state.theme.uid}`);
    locationService.push('/themes');
  };

  onNameChange = (evt: FormEvent<HTMLInputElement>) => {
    this.setState({
      theme: {
        ...this.state.theme,
        name: evt.currentTarget.value,
      },
    });
  };

  onDescriptionChange = (evt: FormEvent<HTMLTextAreaElement>) => {
    this.setState({
      theme: {
        ...this.state.theme,
        description: evt.currentTarget.value,
      },
    });
  };

  onCodeBlur = (code: string) => {
    const customTheme: CustomThemeDTO = { ...this.state.theme, body: JSON.parse(code) };
    const runtimeTheme = setRuntimeTheme(customTheme, this.state.safeMode);

    this.setState({
      theme: customTheme,
      defJson: code,
      fullJson: this.getFullJson(runtimeTheme),
    });

    this.onSave();
  };

  getFullJson(theme: GrafanaTheme2) {
    const slim = {
      colors: theme.colors,
      spacing: theme.spacing,
      shadows: theme.shadows,
      components: theme.components,
      visualization: theme.visualization,
    };

    return JSON.stringify(slim, null, 2);
  }

  changeTab(tab: string) {
    this.setState({ tab });
  }

  reset() {
    this.setState(defaultState);
  }
}

let editState: ThemeEditPageState | null = null;

export function getThemeEditStateManager() {
  if (!editState) {
    editState = new ThemeEditPageState();
  }
  return editState;
}
