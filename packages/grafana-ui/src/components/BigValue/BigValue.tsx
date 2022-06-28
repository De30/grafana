import React, { PureComponent } from 'react';

import { FormattedValueDisplay } from '../FormattedValueDisplay/FormattedValueDisplay';

import { buildLayout } from './BigValueLayout';
import { BigValueJustifyMode, Props } from './types';

export class BigValue extends PureComponent<Props> {
  static defaultProps: Partial<Props> = {
    justifyMode: BigValueJustifyMode.Auto,
  };

  render() {
    const { onClick, className, hasLinks } = this.props;
    const layout = buildLayout(this.props);
    const panelStyles = layout.getPanelStyles();
    const valueAndTitleContainerStyles = layout.getValueAndTitleContainerStyles();
    const valueStyles = layout.getValueStyles();
    const titleStyles = layout.getTitleStyles();
    const textValues = layout.textValues;

    // When there is an outer data link this tooltip will override the outer native tooltip
    const tooltip = hasLinks ? undefined : textValues.tooltip;

    return (
      <div className={className} style={panelStyles} onClick={onClick} title={tooltip}>
        <div style={valueAndTitleContainerStyles}>
          {textValues.title && <div style={titleStyles}>{textValues.title}</div>}
          <FormattedValueDisplay value={textValues} style={valueStyles} />
        </div>
        {layout.renderChart()}
      </div>
    );
  }
}
