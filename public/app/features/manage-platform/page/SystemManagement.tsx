import React, { useState } from 'react';
import { Button, HorizontalGroup, InlineField, Input, useStyles2, InlineSwitch } from '@grafana/ui';
import { GrafanaTheme2 } from '@grafana/data';
import { css } from '@emotion/css';

// TODO: state persistence on tab change?

type SystemMgmtState = {
  ipAddress: string;
  username: string;
  password: string;
  enableBluetooth: boolean;
  enableI2C: boolean;
  enableVNC: boolean;
  enableSwitch: boolean;
  enableCamera: boolean;
  enable1Wire: boolean;
  enableSPI: boolean;
  enableRemoteGPIO: boolean;
};

export const SystemManagement = () => {
  const initialState = {
    ipAddress: '',
    username: '',
    password: '',
    enableBluetooth: true,
    enableI2C: true,
    enableVNC: true,
    enableSwitch: true,
    enableCamera: true,
    enable1Wire: true,
    enableSPI: true,
    enableRemoteGPIO: true,
  };

  const styles = useStyles2(getStyles);
  const [systemMgmtSettings, setSystemMgmtSettings] = useState<SystemMgmtState>(initialState);

  const onValueChange = (event: React.SyntheticEvent<HTMLInputElement>) => {
    const { name, value } = event.currentTarget;
    setSystemMgmtSettings({ ...systemMgmtSettings, [name]: value });
  };

  const onSwitchChange = (event: React.SyntheticEvent<HTMLInputElement>) => {
    const { name, checked } = event.currentTarget;
    setSystemMgmtSettings({ ...systemMgmtSettings, [name]: checked });
  };

  return (
    <div>
      <div className={styles.systemMgmtWrapper}>
        <InlineField
          className={styles.systemMgmtItem}
          label="IP Address"
          tooltip="IP Address of the system you wish to manage"
        >
          <Input name="ipAddress" placeholder="1.1.1.1" value={systemMgmtSettings.ipAddress} onChange={onValueChange} />
        </InlineField>

        <InlineField
          className={styles.systemMgmtItem}
          label="Username"
          tooltip="Username of account on the system you wish to manage"
        >
          <Input name="username" placeholder="root" value={systemMgmtSettings.username} onChange={onValueChange} />
        </InlineField>

        <InlineField
          className={styles.systemMgmtItem}
          label="Password"
          tooltip="Password of account on the system you wish to manage"
        >
          <Input
            name="password"
            type="password"
            placeholder="password"
            value={systemMgmtSettings.password}
            onChange={onValueChange}
          />
        </InlineField>
      </div>

      <div className={styles.systemMgmtToggles}>
        <div className={styles.systemMgmtToggleItem}>
          <InlineField label="Bluetooth" tooltip="Enable bluetooth" className={styles.inlineField}>
            <InlineSwitch
              name="enableBluetooth"
              className={styles.switch}
              value={systemMgmtSettings.enableBluetooth}
              onChange={onSwitchChange}
            />
          </InlineField>
        </div>

        <div className={styles.systemMgmtToggleItem}>
          <InlineField
            className={styles.inlineFieldRight}
            label="I2C"
            tooltip="Enable I2C (multi-device bus used to connect low-speed peripherals to computers and embedded systems)"
          >
            <InlineSwitch
              name="enableI2C"
              className={styles.switch}
              value={systemMgmtSettings.enableI2C}
              onChange={onSwitchChange}
            />
          </InlineField>
        </div>

        <div className={styles.systemMgmtToggleItem}>
          <InlineField
            className={styles.inlineField}
            label="VNC"
            tooltip="Enable VNC (tool for accessing your Raspberry Pi graphical desktop remotely"
          >
            <InlineSwitch
              name="enableVNC"
              className={styles.switch}
              value={systemMgmtSettings.enableVNC}
              onChange={onSwitchChange}
            />
          </InlineField>
        </div>

        <div className={styles.systemMgmtToggleItem}>
          <InlineField
            className={styles.inlineFieldRight}
            label="Switch"
            tooltip="Enable serial (low-level way to send data between the Raspberry Pi and another computer system)"
          >
            <InlineSwitch
              name="enableSwitch"
              className={styles.switch}
              value={systemMgmtSettings.enableSwitch}
              onChange={onSwitchChange}
            />
          </InlineField>
        </div>

        <div className={styles.systemMgmtToggleItem}>
          <InlineField label="Camera" tooltip="Enable camera" className={styles.inlineField}>
            <InlineSwitch
              name="enableCamera"
              className={styles.switch}
              value={systemMgmtSettings.enableCamera}
              onChange={onSwitchChange}
            />
          </InlineField>
        </div>

        <div className={styles.systemMgmtToggleItem}>
          <InlineField
            className={styles.inlineFieldRight}
            label="1-Wire"
            tooltip="Enable 1-Wire (single-wire communication bus typically used to connect sensors)"
          >
            <InlineSwitch
              name="enable1Wire"
              className={styles.switch}
              value={systemMgmtSettings.enable1Wire}
              onChange={onSwitchChange}
            />
          </InlineField>
        </div>

        <div className={styles.systemMgmtToggleItem}>
          <InlineField
            className={styles.inlineField}
            label="SPI"
            tooltip="Enable SPI (a full-duplex serial protocol for communicating with high-speed peripherals)"
          >
            <InlineSwitch
              name="enableSPI"
              className={styles.switch}
              value={systemMgmtSettings.enableSPI}
              onChange={onSwitchChange}
            />
          </InlineField>
        </div>

        <div className={styles.systemMgmtToggleItem}>
          <InlineField
            className={styles.inlineFieldRight}
            label="Remote GPIO"
            tooltip="Enable remote GPIO (General-Purpose Input/Output)"
          >
            <InlineSwitch
              name="enableRemoteGPIO"
              className={styles.switch}
              value={systemMgmtSettings.enableRemoteGPIO}
              onChange={onSwitchChange}
            />
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
  systemMgmtWrapper: css`
    margin-top: 20px;
    margin-bottom: 20px;
    display: flex;
    flex-direction: column;
  `,
  systemMgmtItem: css`
    margin-top: 10px;
    align-items: flex-end;

    label {
      background: transparent;
      justify-content: flex-end;
      width: 100px;
    }
  `,
  systemMgmtToggles: css`
    display: flex;
    flex-wrap: wrap;
    width: 400px;
    align-items: flex-end;
  `,
  systemMgmtToggleItem: css`
    flex: 0 50%;
  `,
  switch: css`
    border: none;
    background: transparent;

    &:hover {
      border: none;
      background: transparent;
    }
  `,
  buttonsContainer: css`
    margin-top: 80px;
  `,
  inlineField: css`
    label {
      width: 100px;
      justify-content: flex-end;
      background: transparent;
    }
  `,
  inlineFieldRight: css`
    > label {
      width: 115px;
      justify-content: flex-end;
      background: transparent;
    }
  `,
});
