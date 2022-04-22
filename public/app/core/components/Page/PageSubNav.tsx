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
      <h1 className={styles.sectionName}>
        {main.icon && <Icon name={main.icon as IconName} size="xl" />}
        {main.img && <img className="page-header__img" src={main.img} alt={`logo of ${main.text}`} />}
        {props.model.main.text}
      </h1>
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
    padding: theme.spacing(3),
    width: '250px',
  }),
  subNav: css``,
});
