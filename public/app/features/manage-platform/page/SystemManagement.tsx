import React from 'react';
import { Button, HorizontalGroup, InlineField, Input, useStyles2, InlineSwitch } from '@grafana/ui';
import { GrafanaTheme2 } from '@grafana/data';
import { css } from '@emotion/css';

// TODO: inlineFieldRight?!

export const SystemManagement = () => {
  const styles = useStyles2(getStyles);

  return (
    <div>
      <div className={styles.systemMgmtWrapper}>
        <InlineField
          className={styles.systemMgmtItem}
          label="IP Address"
          tooltip="IP Address of the system you wish to manage"
        >
          <Input placeholder="1.1.1.1" />
        </InlineField>

        <InlineField
          className={styles.systemMgmtItem}
          label="Username"
          tooltip="Username of account on the system you wish to manage"
        >
          <Input placeholder="root" />
        </InlineField>

        <InlineField
          className={styles.systemMgmtItem}
          label="Password"
          tooltip="Password of account on the system you wish to manage"
        >
          <Input type="password" placeholder="password" />
        </InlineField>
      </div>

      <div className={styles.systemMgmtToggles}>
        <div className={styles.systemMgmtToggleItem}>
          <InlineField label="Bluetooth" tooltip="Enable bluetooth" className={styles.inlineField}>
            <InlineSwitch className={styles.switch} value={true} />
          </InlineField>
        </div>

        <div className={styles.systemMgmtToggleItem}>
          <InlineField
            className={styles.inlineFieldRight}
            label="I2C"
            tooltip="Enable I2C (multi-device bus used to connect low-speed peripherals to computers and embedded systems)"
          >
            <InlineSwitch className={styles.switch} value={true} />
          </InlineField>
        </div>

        <div className={styles.systemMgmtToggleItem}>
          <InlineField
            className={styles.inlineField}
            label="VNC"
            tooltip="Enable VNC (tool for accessing your Raspberry Pi graphical desktop remotely"
          >
            <InlineSwitch className={styles.switch} value={true} />
          </InlineField>
        </div>

        <div className={styles.systemMgmtToggleItem}>
          <InlineField
            className={styles.inlineFieldRight}
            label="Switch"
            tooltip="Enable serial (low-level way to send data between the Raspberry Pi and another computer system)"
          >
            <InlineSwitch className={styles.switch} value={true} />
          </InlineField>
        </div>

        <div className={styles.systemMgmtToggleItem}>
          <InlineField label="Camera" tooltip="Enable camera" className={styles.inlineField}>
            <InlineSwitch className={styles.switch} value={true} />
          </InlineField>
        </div>

        <div className={styles.systemMgmtToggleItem}>
          <InlineField
            className={styles.inlineFieldRight}
            label="1-Wire"
            tooltip="Enable 1-Wire (single-wire communication bus typically used to connect sensors)"
          >
            <InlineSwitch className={styles.switch} value={true} />
          </InlineField>
        </div>

        <div className={styles.systemMgmtToggleItem}>
          <InlineField
            className={styles.inlineField}
            label="SPI"
            tooltip="Enable SPI (a full-duplex serial protocol for communicating with high-speed peripherals)"
          >
            <InlineSwitch className={styles.switch} value={true} />
          </InlineField>
        </div>

        <div className={styles.systemMgmtToggleItem}>
          <InlineField
            className={styles.inlineFieldRight}
            label="Remote GPIO"
            tooltip="Enable remote GPIO (General-Purpose Input/Output)"
          >
            <InlineSwitch className={styles.switch} value={true} />
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
