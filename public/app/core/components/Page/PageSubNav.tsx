import { css } from '@emotion/css';
import React from 'react';

import { NavModel, GrafanaTheme2 } from '@grafana/data';
import { IconName, useStyles2, Icon, VerticalTab } from '@grafana/ui';

export interface Props {
  model: NavModel;
}

export function PageSubNav(props: Props) {
  const styles = useStyles2(getStyles);

  const main = props.model.main;

  return (
    <nav className={styles.nav}>
      <h2 className={styles.sectionName}>
        {main.icon && <Icon name={main.icon as IconName} size="lg" />}
        {main.img && <img className="page-header__img" src={main.img} alt={`logo of ${main.text}`} />}
        {props.model.main.text}
      </h2>
      <div className={styles.items}>
        {props.model.main.children?.map((child, index) => {
          return (
            !child.hideFromTabs && (
              <VerticalTab
                label={child.text}
                active={child.active}
                key={`${child.url}-${index}`}
                // icon={child.icon as IconName}
                href={child.url}
                onChangeTab={undefined}
              />
            )
          );
        })}
      </div>
    </nav>
  );
}

const getStyles = (theme: GrafanaTheme2) => {
  return {
    nav: css({
      display: 'flex',
      flexDirection: 'column',
      background: theme.colors.background.secondary,
      padding: theme.spacing(3, 2),
      width: '250px',
    }),
    sectionName: css({
      display: 'flex',
      gap: theme.spacing(1),
      padding: theme.spacing(0.5, 0, 3, 0.25),
      fontSize: theme.typography.h3.fontSize,
      margin: 0,
    }),
    items: css({
      paddingLeft: '9px',
    }),
    subNav: css``,
  };
};
