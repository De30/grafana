// Libraries
import React, { FC, HTMLAttributes, useEffect } from 'react';
import { getTitleFromNavModel } from 'app/core/selectors/navModel';

// Components
import PageHeader from '../PageHeader/PageHeader';
import { Footer } from '../Footer/Footer';
import { PageContents } from './PageContents';
import { CustomScrollbar, Icon, IconName, PageToolbar, useStyles } from '@grafana/ui';
import { GrafanaTheme, NavModel, NavModelItem } from '@grafana/data';
import { Branding } from '../Branding/Branding';
import { css, cx } from 'emotion';

interface Props extends HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
  navModel: NavModel;
}

export interface PageType extends FC<Props> {
  Header: typeof PageHeader;
  Contents: typeof PageContents;
}

export const Page: PageType = ({ navModel, children, ...otherProps }) => {
  const styles = useStyles(getStyles);

  useEffect(() => {
    const title = getTitleFromNavModel(navModel);
    document.title = title ? `${title} - ${Branding.AppTitle}` : Branding.AppTitle;
  }, [navModel]);

  console.log(navModel);

  return (
    <div {...otherProps} className={styles.wrapper}>
      <CustomScrollbar autoHeightMin={'100%'}>
        <PageToolbar
          pageIcon={navModel.main.icon as IconName}
          title={navModel.node.text}
          parent={navModel.main.text}
          onClickParent={() => {}}
        ></PageToolbar>
        <div className={styles.sideNavWrapper}>
          <div className={styles.sideNav}>
            <div className={styles.sideNavHeading}>Administration</div>
            {navModel.main.children?.map((child) => (
              <a
                key={child.text}
                className={cx(styles.sideNavLink, { [styles.sideNavLinkActive]: child.active })}
                href={child.url}
              >
                {child.text}
              </a>
            ))}
          </div>
          <div className={styles.pageColumn}>
            {renderHeaderTitle(navModel.node, styles)}
            <div className={styles.page}>{children}</div>
          </div>
        </div>
      </CustomScrollbar>
    </div>
  );
};

function renderHeaderTitle(node: NavModelItem, styles: PageStyles) {
  return (
    <div className={styles.pageHeadingWrapper}>
      <span className={styles.pageHeadingLogo}>
        {node.icon && <Icon name={node.icon as IconName} size="xxl" />}
        {node.img && <img src={node.img} alt={`logo of ${node.text}`} />}
      </span>

      <div className={styles.pageHeading}>{node.text}</div>
    </div>
  );
}

Page.Header = PageHeader;
Page.Contents = PageContents;

export default Page;

const getStyles = (theme: GrafanaTheme) => ({
  wrapper: css`
    position: absolute;
    top: 0;
    bottom: 0;
    width: 100%;
    background: ${theme.colors.dashboardBg};
    display: flex;
    flex-direction: column;
  `,
  sideNavWrapper: css`
    display: flex;
    flex-direction: row;
    padding: ${theme.spacing.md};
  `,
  sideNav: css`
    width: 200px;
    margin-right: ${theme.spacing.md};
    display: flex;
    flex-direction: column;
  `,
  sideNavHeading: css`
    font-size: ${theme.typography.size.lg};
    font-weight: ${theme.typography.weight.semibold};
    margin-bottom: ${theme.spacing.md};
  `,
  sideNavLink: css`
    margin-bottom: ${theme.spacing.sm};
  `,
  sideNavLinkActive: css`
    color: ${theme.colors.linkExternal};
    font-weight: ${theme.typography.weight.semibold};
  `,
  pageHeading: css`
    font-size: ${theme.typography.heading.h2};
    display: flex;
    align-items: center;
    padding-left: ${theme.spacing.md};
  `,
  pageHeadingWrapper: css`
    flex-grow: 1;
    display: flex;
    margin-bottom: ${theme.spacing.md};
  `,
  pageHeadingLogo: css``,
  pageColumn: css`
    display: flex;
    flex-direction: column;
    flex: 1 1 100%;
    margin: 0 auto;
    max-width: 1200px;
  `,
  page: css`
    display: flex;
    flex-direction: column;
    padding: ${theme.spacing.md};
    background: ${theme.colors.bg1};
    border: 1px solid ${theme.colors.border1};
    border-radius: ${theme.border.radius.sm};
  `,
});

type PageStyles = ReturnType<typeof getStyles>;
