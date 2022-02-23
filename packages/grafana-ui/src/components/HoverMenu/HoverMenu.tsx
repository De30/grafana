import React, { useEffect } from 'react';
import { css } from '@emotion/css';
import { useStyles2 } from '../../themes';
import { GrafanaTheme2 } from '@grafana/data';
import { Tooltip } from '../Tooltip/Tooltip';
import { Icon } from '../Icon/Icon';
import { Portal } from '../Portal/Portal';
import { usePopperTooltip } from 'react-popper-tooltip';

/**
 * @internal
 */
export interface Props {
  triggerRef: HTMLDivElement | null;
}

/**
 * @internal
 */
export function HoverMenu({ triggerRef }: Props) {
  const styles = useStyles2(getStyles);

  const { getTooltipProps, setTooltipRef, setTriggerRef, visible } = usePopperTooltip({
    placement: 'top-end',
    interactive: true,
    delayHide: 100,
    delayShow: 150,
    offset: [0, 8],
    trigger: ['hover', 'focus'],
  });

  useEffect(() => {
    if (triggerRef) {
      setTriggerRef(triggerRef);
    }
  }, [triggerRef, setTriggerRef]);

  if (!triggerRef || !visible) {
    return null;
  }

  return (
    <Portal>
      <div className={styles.bubbleMenu} ref={setTooltipRef} {...getTooltipProps()}>
        <Tooltip content="View panel" placement="top">
          <div className={styles.bubbleMenuItem}>
            <Icon name="eye" className="panel-chrome-bubble-menu-icon" />
          </div>
        </Tooltip>
        <Tooltip content="Edit panel" placement="top">
          <div className={styles.bubbleMenuItem}>
            <Icon name="pen" className="panel-chrome-bubble-menu-icon" />
          </div>
        </Tooltip>
        <Tooltip content="Share panel" placement="top">
          <div className={styles.bubbleMenuItem}>
            <Icon name="share-alt" className="panel-chrome-bubble-menu-icon" />
          </div>
        </Tooltip>
        {/* <DropdownMenu className={styles.bubbleMenuItem} /> */}
      </div>
    </Portal>
  );
}

const getStyles = (theme: GrafanaTheme2) => {
  return {
    bubbleMenu: css`
      box-shadow: ${theme.shadows.z2};
      display: flex;
      align-items: center;
      padding: 1px solid;
      border-radius: ${theme.shape.borderRadius()};
      background: ${theme.colors.background.secondary};
      border: 1px solid ${theme.colors.border.weak};
      box-shadow: ${theme.shadows.z2};
      padding: 1px;
    `,
    bubbleMenuItem: css`
      display: flex;
      align-items: center;
      height: ${theme.spacing(4)};
      border-radius: ${theme.shape.borderRadius()};
      padding: ${theme.spacing(1)};

      &:hover {
        background: ${theme.colors.action.hover};

        .panel-chrome-bubble-menu-icon {
          color: ${theme.colors.text.primary};
        }
      }

      .panel-chrome-bubble-menu-icon {
        color: ${theme.colors.text.secondary};
      }
    `,
  };
};
