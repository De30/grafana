import React from 'react';
import { css } from '@emotion/css';
import { IconName, useStyles2, Icon, VerticalTab } from '@grafana/ui';
import { NavModel, GrafanaTheme2 } from '@grafana/data';

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
      {props.model.main.children?.map((child, index) => {
        return (
          !child.hideFromTabs && (
            <VerticalTab
              label={child.text}
              active={child.active}
              key={`${child.url}-${index}`}
              icon={child.icon as IconName}
              href={child.url}
              onChangeTab={undefined}
            />
          )
        );
      })}
    </nav>
  );
}

const getStyles = (theme: GrafanaTheme2) => ({
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
    fontSize: theme.typography.h3.fontSize,
  }),
  subNav: css``,
});
