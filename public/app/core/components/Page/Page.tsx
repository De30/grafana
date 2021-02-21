// Libraries
import React, { FC, HTMLAttributes, useEffect } from 'react';
import { getTitleFromNavModel } from 'app/core/selectors/navModel';

// Components
import PageHeader from '../PageHeader/PageHeader';
import { Footer } from '../Footer/Footer';
import { PageContents } from './PageContents';
import { CustomScrollbar, IconName, PageToolbar, useStyles } from '@grafana/ui';
import { GrafanaTheme, NavModel } from '@grafana/data';
import { Branding } from '../Branding/Branding';
import { css } from 'emotion';

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
      <PageToolbar
        pageIcon={navModel.main.icon as IconName}
        title={navModel.node.text}
        parent={navModel.main.text}
        onClickParent={() => {}}
      ></PageToolbar>
      <div className={styles.subNavWrapper}>
        <div className={styles.subNav}></div>
        <div className={styles.page}>
          <CustomScrollbar autoHeightMin={'100%'}>
            {children}
            <Footer />
          </CustomScrollbar>
        </div>
      </div>
    </div>
  );
};

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
  subNavWrapper: css`
    display: flex;
    flex-direction: row;
    padding: ${theme.spacing.md};
  `,
  subNav: css`
    width: 200px;
    margin-right: ${theme.spacing.md};
  `,
  page: css`
    flex-grow: 1;
  `,
});
