import React, { PureComponent } from 'react';
import { Button } from '@grafana/ui';

import { DimensionContext } from 'app/features/dimensions/context';
import { TextDimensionEditor } from 'app/features/dimensions/editors/TextDimensionEditor';
import { TextDimensionConfig } from 'app/features/dimensions/types';
import { CanvasElementItem, CanvasElementProps } from '../element';
import { APIEditor, APIEditorConfig } from 'app/plugins/panel/canvas/editor/APIEditor';
import { getBackendSrv } from '@grafana/runtime';

interface ButtonData {
  text?: string;
  api?: APIEditorConfig;
}

interface ButtonConfig {
  text?: TextDimensionConfig;
  api?: APIEditorConfig;
}

class ButtonDisplay extends PureComponent<CanvasElementProps<ButtonConfig, ButtonData>> {
  render() {
    const { data } = this.props;
    const onClick = () => {
      if (data?.api) {
        getBackendSrv()
          .fetch({
            url: data?.api.endpoint!,
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Access-Control-Allow-Origin': '*',
              'Access-Control-Allow-Methods': 'POST',
              'Access-Control-Allow-Headers': 'Content-Type, Authorization',
            },
            data: data?.api.data ?? {},
          })
          .subscribe({
            next: (v: any) => {
              console.log('GOT', v);
            },
            error: (err: any) => {
              console.log('GOT ERROR', err);
              alert('TODO... button click: ' + JSON.stringify(err));
            },
            complete: () => {
              // this.setState({ working: false });
            },
          });
      }
    };

    return <Button onClick={onClick}>{data?.text}</Button>;
  }
}

export const buttonItem: CanvasElementItem<ButtonConfig, ButtonData> = {
  id: 'button',
  name: 'Button',
  description: 'Button',

  display: ButtonDisplay,

  defaultSize: {
    width: 200,
    height: 50,
  },

  getNewOptions: (options) => ({
    ...options,
  }),

  // Called when data changes
  prepareData: (ctx: DimensionContext, cfg: ButtonConfig) => {
    const data: ButtonData = {
      text: cfg?.text ? ctx.getText(cfg.text).value() : '',
      api: cfg?.api ?? undefined,
    };

    return data;
  },

  // Heatmap overlay options
  registerOptionsUI: (builder) => {
    const category = ['Button'];
    builder.addCustomEditor({
      category,
      id: 'textSelector',
      path: 'config.text',
      name: 'Text',
      editor: TextDimensionEditor,
    });
    builder.addCustomEditor({
      category,
      id: 'apiSelector',
      path: 'config.api',
      name: 'API',
      editor: APIEditor,
    });
  },
};
