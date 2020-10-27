import React, { FC } from 'react';
import { css } from 'emotion';
import { VerticalTab, Icon, IconName, stylesFactory } from '@grafana/ui';
import appEvents from 'app/core/app_events';
import { NavModel, NavModelItem, NavModelBreadcrumb } from '@grafana/data';
import { CoreEvents } from 'app/types';
import { config } from 'app/core/config';

export interface Props {
  model: NavModel;
}

export const Navigation: FC<Props> = ({ model }) => {
  if (!model) {
    return null;
  }

  const main = model.main;
  const children = main.children;

  if (!children || children.length === 0) {
    return null;
  }

  const styles = getStyles();

  const goToUrl = (index: number) => {
    children.forEach((child, i) => {
      if (i === index) {
        appEvents.emit(CoreEvents.locationChange, { href: child.url });
      }
    });
  };

  return (
    <nav className={styles.nav}>
      <div className={styles.navHeading}>{main.text}</div>
      <div className={styles.navItems}>
        {children.map((child, index) => {
          return (
            !child.hideFromTabs && (
              <VerticalTab
                label={child.text}
                active={child.active}
                key={`${child.url}-${index}`}
                icon={child.icon as IconName}
                onChangeTab={() => goToUrl(index)}
                href={child.url}
              />
            )
          );
        })}
      </div>
    </nav>
  );
};

export default class PageHeader extends React.Component<Props, any> {
  constructor(props: Props) {
    super(props);
  }

  shouldComponentUpdate() {
    //Hack to re-render on changed props from angular with the @observer decorator
    return true;
  }

  renderTitle(title: string, breadcrumbs: NavModelBreadcrumb[]) {
    if (!title && (!breadcrumbs || breadcrumbs.length === 0)) {
      return null;
    }

    if (!breadcrumbs || breadcrumbs.length === 0) {
      return <h1 className="page-header__title">{title}</h1>;
    }

    const breadcrumbsResult = [];
    for (const bc of breadcrumbs) {
      if (bc.url) {
        breadcrumbsResult.push(
          <a className="text-link" key={breadcrumbsResult.length} href={bc.url}>
            {bc.title}
          </a>
        );
      } else {
        breadcrumbsResult.push(<span key={breadcrumbsResult.length}> / {bc.title}</span>);
      }
    }
    breadcrumbsResult.push(<span key={breadcrumbs.length + 1}> / {title}</span>);

    return <h1 className="page-header__title">{breadcrumbsResult}</h1>;
  }

  renderHeaderTitle(main: NavModelItem) {
    const iconClassName =
      main.icon === 'grafana'
        ? css`
            margin-top: 12px;
          `
        : css`
            margin-top: 14px;
          `;

    return (
      <div className="page-header__inner">
        <span className="page-header__logo">
          {main.icon && <Icon name={main.icon as IconName} size="xxxl" className={iconClassName} />}
          {main.img && <img className="page-header__img" src={main.img} />}
        </span>

        <div className="page-header__info-block">
          {this.renderTitle(main.text, main.breadcrumbs ?? [])}
          {main.subTitle && <div className="page-header__sub-title">{main.subTitle}</div>}
        </div>
      </div>
    );
  }

  render() {
    const { model } = this.props;

    if (!model) {
      return null;
    }

    let node = model.node;

    return (
      <div className="page-header-canvas">
        <div className="page-header">{this.renderHeaderTitle(node)}</div>
      </div>
    );
  }
}

export const getStyles = stylesFactory(() => {
  return {
    nav: css`
      display: flex;
      flex-direction: column;
      flex-grow: 1;
    `,
    navHeading: css`
      margin-bottom: 16px;
      font-size: ${config.theme.typography.size.lg};
    `,
    navItems: css`
      display: flex;
      flex-direction: column;
    `,
  };
});
