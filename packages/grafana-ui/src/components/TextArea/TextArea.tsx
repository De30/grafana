import React, { HTMLProps, useImperativeHandle, useRef } from 'react';
import { GrafanaTheme2 } from '@grafana/data';
import { css, cx } from '@emotion/css';
import { stylesFactory, useTheme2 } from '../../themes';
import { getFocusStyle, sharedInputStyle } from '../Forms/commonStyles';
import { useEffectOnce } from 'react-use';

export interface Props extends Omit<HTMLProps<HTMLTextAreaElement>, 'size'> {
  /** Show an invalid state around the input */
  invalid?: boolean;
}

export const TextArea = React.forwardRef<HTMLTextAreaElement, Props>(
  ({ invalid, className, ...props }, forwardedRef) => {
    const theme = useTheme2();
    const styles = getTextAreaStyle(theme, invalid);
    const textAreaRef = useRef<HTMLTextAreaElement>(null);
    useImperativeHandle(forwardedRef, () => textAreaRef.current!);

    useEffectOnce(() => {
      if (props.autoFocus) {
        textAreaRef.current?.focus();
      }
    });

    return <textarea {...props} className={cx(styles.textarea, className)} ref={textAreaRef} />;
  }
);

const getTextAreaStyle = stylesFactory((theme: GrafanaTheme2, invalid = false) => {
  return {
    textarea: cx(
      sharedInputStyle(theme),
      getFocusStyle(theme.v1),
      css`
        border-radius: ${theme.shape.borderRadius()};
        padding: ${theme.spacing.gridSize / 4}px ${theme.spacing.gridSize}px;
        width: 100%;
        border-color: ${invalid ? theme.colors.error.border : theme.components.input.borderColor};
      `
    ),
  };
});

TextArea.displayName = 'TextArea';
