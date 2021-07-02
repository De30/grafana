import React, { Component, useEffect, useState } from 'react';
import { PanelProps } from '@grafana/data';
import usePrevious from 'react-use/lib/usePrevious';

import { DebugPanelOptions, DebugMode, DebugPanelFieldConfig } from './types';
import { EventBusLoggerPanel } from './EventBusLogger';
import { RenderInfoViewer } from './RenderInfoViewer';
import { CursorView } from './CursorView';

type Props = PanelProps<DebugPanelOptions>;

export class DebugPanel extends Component<Props> {
  render() {
    const { options, fieldConfig } = this.props;

    if (options.mode === DebugMode.Events) {
      return <EventBusLoggerPanel eventBus={this.props.eventBus} />;
    }
    if (options.mode === DebugMode.Cursor) {
      return <CursorView eventBus={this.props.eventBus} />;
    }

    if (options.mode === DebugMode.Options) {
      return <OptionsView panelOptions={options} fieldConfig={fieldConfig.defaults.custom} />;
    }

    return <RenderInfoViewer {...this.props} />;
  }
}

interface OptionsViewProps {
  panelOptions: DebugPanelOptions;
  fieldConfig?: DebugPanelFieldConfig;
}
// const OptionsView: React.FC<OptionsViewProps> = ({ panelOptions, fieldConfig }) => {
//   const previousOptions = usePrevious(panelOptions);
//   const previousFieldConfig = usePrevious(fieldConfig);
//
//
// };

interface OptionsViewState {
  fcRev: number;
  fcTextlORev: number;
  fcL1: number;
  fcL2: number;
  prevFc?: DebugPanelFieldConfig;
}
class OptionsView extends React.Component<OptionsViewProps, OptionsViewState> {
  constructor(props: OptionsViewProps) {
    super(props);
    this.state = {
      fcRev: 0,
      fcTextlORev: 0,
      fcL1: 0,
      fcL2: 0,
      prevFc: props.fieldConfig,
    };
  }
  // componentDidUpdate(prevProps: OptionsViewProps) {
  //   const { fieldConfig } = this.props;
  //   const { fieldConfig: previousFieldConfig } = prevProps;
  //
  //   let update: OptionsViewState = {} as OptionsViewState;
  //
  //   if (this.props === prevProps) {
  //     return;
  //   }
  //
  //   console.log(previousFieldConfig, fieldConfig);
  //   if (previousFieldConfig !== fieldConfig) {
  //     update = { ...update, fcRev: this.state.fcRev + 1, prevFc: previousFieldConfig };
  //   }
  //   if (previousFieldConfig?.debugText !== fieldConfig?.debugText) {
  //     update = { ...update, fcTextlORev: this.state.fcTextlORev + 1 };
  //   }
  //
  //   if (previousFieldConfig?.l1 !== fieldConfig?.l1) {
  //     update = { ...update, fcL1: this.state.fcL1 + 1 };
  //   }
  //
  //   if (previousFieldConfig?.l1?.l2 !== fieldConfig?.l1?.l2) {
  //     update = { ...update, fcL2: this.state.fcL2 + 1 };
  //   }
  //
  //   if (Object.keys(update).length > 0) {
  //     this.setState(update);
  //   }
  // }
  render() {
    // const { fcRev, fcTextlORev, fcL2, fcL1, prevFc } = this.state;
    const { fieldConfig, panelOptions } = this.props;
    console.log('rnd');
    return (
      <>
        {/*<h2>Panel Options equality:</h2>*/}
        {/*<pre>{JSON.stringify(panelOptions)}</pre>*/}
        {/*<div>Panel options: {previousOptions === panelOptions ? 'Equal' : 'Not equal'}</div>*/}
        {/*<div>*/}
        {/*  Text l0:{' '}*/}
        {/*  {previousOptions?.debugOptions?.debugText === panelOptions?.debugOptions?.debugText ? 'Equal' : 'Not equal'}*/}
        {/*</div>*/}
        {/*<div>*/}
        {/*  Object nested debugOptions:{' '}*/}
        {/*  {previousOptions?.debugOptions === panelOptions?.debugOptions ? 'Equal' : 'Not equal'}*/}
        {/*</div>*/}
        {/*<div>*/}
        {/*  Object nested l1:{' '}*/}
        {/*  {previousOptions?.debugOptions?.l1 === panelOptions?.debugOptions?.l1 ? 'Equal' : 'Not equal'}*/}
        {/*</div>*/}
        {/*<div>*/}
        {/*  Object nested l2:{' '}*/}
        {/*  {previousOptions?.debugOptions?.l1?.l2 === panelOptions?.debugOptions?.l1?.l2 ? 'Equal' : 'Not equal'}*/}
        {/*</div>*/}
        {/*<hr />*/}
        {/*<h2>Custom field config equality</h2>*/}
        {/*<pre>{JSON.stringify(prevFc)}</pre>*/}
        {/*<pre>{JSON.stringify(fieldConfig)}</pre>*/}
        {/*<div>Field config rev: {fcRev}</div>*/}
        {/*<div>Text l0 rev: {fcTextlORev}</div>*/}
        {/*<div>Object nested l1 rev: {fcL1}</div>*/}
        {/*<div>Object nested l2 rev: {fcL2}</div>*/}
        <Nested title="l1" options={panelOptions.debugOptions} />
        <Nested title="l2" options={panelOptions.debugOptions?.l1} />
        {/*<div>*/}
        {/*  Value nested l2({previousFieldConfig?.l1?.l2?.text}/{fieldConfig?.l1?.l2?.text} ):{' '}*/}
        {/*  {previousFieldConfig?.l1?.l2?.text === fieldConfig?.l1?.l2?.text ? 'Equal' : 'Not equal'}*/}
        {/*</div>*/}
      </>
    );
  }
}

const Nested = (props: any) => {
  // const [renderCtr, setRenderCtr] = useState(0);

  const prv = usePrevious(props.options);

  return (
    <>
      <h2>{props.title} - render Panel</h2>
      <pre>{JSON.stringify(prv)}</pre>
      <pre>{JSON.stringify(props.options)}</pre>
    </>
  );
};
