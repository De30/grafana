import React from 'react';
import { Button, HorizontalGroup, InlineField, Input, Switch, useStyles2 } from '@grafana/ui';
import { GrafanaTheme2 } from '@grafana/data';
import { css } from '@emotion/css';

const LABEL_WIDTH = 15;

// TODO: Perfect styling

export const SystemManagement = () => {
  const styles = useStyles2(getStyles);

  return (
    <div>
      <div className={styles.systemSettingsWrapper}>
        <InlineField
          className={styles.systemSettingsItem}
          labelWidth={LABEL_WIDTH}
          label="IP Address"
          tooltip="IP Address of the system you wish to manage"
        >
          <Input placeholder="1.1.1.1" />
        </InlineField>
        <InlineField
          className={styles.systemSettingsItem}
          labelWidth={LABEL_WIDTH}
          label="Username"
          tooltip="Username of account on the system you wish to manage"
        >
          <Input placeholder="root" />
        </InlineField>
        <InlineField
          className={styles.systemSettingsItem}
          labelWidth={LABEL_WIDTH}
          label="Password"
          tooltip="Password of account on the system you wish to manage"
        >
          <Input type="password" />
        </InlineField>
      </div>
      <div className={styles.systemToggles}>
        <InlineField className={styles.systemToggleItem} label="Bluetooth" tooltip="Enable bluetooth">
          <Switch className={styles.switch} value={true} />
        </InlineField>
        <InlineField
          className={styles.systemToggleItem}
          label="I2C"
          tooltip="Enable I2C (multi-device bus used to connect low-speed peripherals to computers and embedded systems)"
        >
          <Switch className={styles.switch} value={true} />
        </InlineField>
        <InlineField
          className={styles.systemToggleItem}
          label="VNC"
          tooltip="Enable VNC (tool for accessing your Raspberry Pi graphical desktop remotely"
        >
          <Switch className={styles.switch} value={true} />
        </InlineField>
        <InlineField
          className={styles.systemToggleItem}
          label="Switch"
          tooltip="Enable serial (low-level way to send data between the Raspberry Pi and another computer system)"
        >
          <Switch className={styles.switch} value={true} />
        </InlineField>
        <InlineField className={styles.systemToggleItem} label="Camera" tooltip="Enable camera">
          <Switch className={styles.switch} value={true} />
        </InlineField>
        <InlineField
          className={styles.systemToggleItem}
          label="1-Wire"
          tooltip="Enable 1-Wire (single-wire communication bus typically used to connect sensors)"
        >
          <Switch className={styles.switch} value={true} />
        </InlineField>
        <InlineField
          className={styles.systemToggleItem}
          label="SPI"
          tooltip="Enable SPI (a full-duplex serial protocol for communicating with high-speed peripherals)"
        >
          <Switch className={styles.switch} value={true} />
        </InlineField>
        <div>
          <InlineField
            className={styles.systemToggleItem}
            label="Remote GPIO"
            tooltip="Enable remote GPIO (General-Purpose Input/Output)"
          >
            <Switch className={styles.switch} value={true} />
          </InlineField>
        </div>
      </div>
      <div className={styles.buttonsContainer}>
        <HorizontalGroup spacing="lg">
          <Button icon="history">Reboot</Button>
          <Button icon="power">Shut down</Button>
        </HorizontalGroup>
      </div>
    </div>
  );
};

const getStyles = (theme: GrafanaTheme2) => ({
  systemSettingsWrapper: css`
    margin-top: 20px;
    margin-bottom: 20px;
    display: flex;
    flex-direction: column;
    align-items: flex-start;
  `,
  systemSettingsItem: css`
    margin-top: 10px;
    margin-bottom: 10px;
    width: 80px;
  `,
  systemToggles: css`
    display: flex;
    flex-direction: row;
    flex-wrap: wrap;
    width: 300px;
  `,
  systemToggleItem: css``,
  switch: css`
    align-self: center;
    background-color: red;
  `,
  buttonsContainer: css`
    margin-top: 20px;
  `,
});
