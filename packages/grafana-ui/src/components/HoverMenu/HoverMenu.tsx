import React, { useEffect, useRef, useState } from 'react';
import { css } from '@emotion/css';
import { useStyles2 } from '../../themes';
import { GrafanaTheme2 } from '@grafana/data';
import { Tooltip } from '../Tooltip/Tooltip';
import { Icon } from '../Icon/Icon';
import { Portal } from '../Portal/Portal';
import { usePopperTooltip } from 'react-popper-tooltip';
import { IconName } from '../../types/icon';

/**
 * @internal
 */
export interface Props {
  children: React.ReactNode;
  offset?: number;
}

export interface State {
  visible?: boolean;
  triggerHasFocus?: boolean;
  menuHasFocus?: boolean;
}

/**
 * @internal
 */
export function HoverMenu({ children, offset = 1 }: Props) {
  const [state, setState] = useState<State>({});
  const menuRef = useRef<HTMLDivElement>(null);
  const outerRef = useRef<HTMLDivElement>(null);

  const { getTooltipProps, setTooltipRef, setTriggerRef, visible } = usePopperTooltip({
    visible: state.visible,
    placement: 'top-end',
    interactive: true,
    delayHide: 100,
    delayShow: 150,
    offset: [0, offset],
    trigger: ['hover'],
  });

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (!menuRef.current) {
        return;
      }

      // Special handling to move focus to portal
      if (e.key === 'Tab' && state.triggerHasFocus) {
        e.preventDefault();
        const firstButton = menuRef.current.getElementsByTagName('button')[0];
        firstButton.focus();
        setState({ ...state, triggerHasFocus: false, menuHasFocus: true });
      }

      // If we are tabbing out of the menu we need to restore focus order
      if (e.key === 'Tab' && state.menuHasFocus) {
        const buttons = menuRef.current.getElementsByTagName('button');
        if (document.activeElement === buttons[buttons.length - 1]) {
          setState({ ...state, menuHasFocus: false, visible: undefined });
          (outerRef.current?.nextSibling as HTMLElement).focus();
        }
      }
    };

    document.addEventListener('keydown', handler);

    return () => {
      document.removeEventListener('keydown', handler);
    };
  }, [state, setState]);

  useEffect(() => {
    if (outerRef.current) {
      const parent = outerRef.current.parentElement!;
      setTriggerRef(parent);

      parent.addEventListener('focus', (e) => {
        setState({ visible: true, triggerHasFocus: true });
      });

      parent.addEventListener('blur', (e) => {
        if (menuRef.current) {
          if (!menuRef.current.contains(e.relatedTarget as Element)) {
            setState({ visible: false, triggerHasFocus: false });
          }
        }
      });
    }
  }, [setTriggerRef, setState]);

  const styles = useStyles2(getStyles);

  return (
    <div ref={outerRef}>
      {visible && (
        <Portal>
          <div ref={setTooltipRef} {...getTooltipProps()}>
            <div ref={menuRef} className={styles.bubbleMenu}>
              {children}
            </div>
          </div>
        </Portal>
      )}
    </div>
  );
}

export interface ItemProps {
  icon: IconName;
  name: string;
  onClick?: () => void;
  children?: React.ReactNode;
}

export const HoverMenuItem = React.forwardRef<HTMLButtonElement, ItemProps>(
  ({ icon, name, onClick, children }, ref) => {
    const styles = useStyles2(getStyles);

    return (
      <Tooltip content={name} placement="top">
        <button className={styles.bubbleMenuItem} onClick={onClick} ref={ref}>
          <Icon name={icon} />
          {children}
        </button>
      </Tooltip>
    );
  }
);

HoverMenuItem.displayName = 'HoverMenuItem';
export interface HoverMenuItemDropdownProps extends ItemProps {
  children: React.ReactNode;
}

export function HoverMenuItemDropdown({ icon, name, children }: HoverMenuItemDropdownProps) {
  const styles = useStyles2(getStyles);
  const { getTooltipProps, setTooltipRef, setTriggerRef, visible } = usePopperTooltip({
    // visible: true,
    placement: 'right-start',
    interactive: true,
    trigger: ['click'],
  });

  return (
    <button className={styles.bubbleMenuItem} ref={setTriggerRef} style={{ position: 'relative' }}>
      <Icon name={icon} />

      {visible && (
        <div ref={setTooltipRef} className={styles.dropdown} {...getTooltipProps()}>
          {children}
        </div>
      )}
    </button>
  );
}

const getStyles = (theme: GrafanaTheme2) => {
  return {
    bubbleMenu: css`
      display: flex;
      align-items: center;
      padding: 1px solid;
      border-radius: ${theme.shape.borderRadius()};
      // background: ${theme.colors.background.primary};
      background: ${theme.colors.background.secondary};
      // background: ${theme.colors.primary.main};
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
      color: ${theme.colors.text.secondary};
      // color: ${theme.colors.primary.contrastText};
      background: transparent;
      border: none;
      box-shadow: none;

      &:hover {
        background: ${theme.colors.action.hover};
        color: ${theme.colors.text.primary};
      }
    `,
    dropdown: css``,
  };
};
