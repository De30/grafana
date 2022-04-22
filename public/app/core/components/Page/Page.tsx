// Libraries
import React, { FC, HTMLAttributes, useEffect } from 'react';
import { getTitleFromNavModel } from 'app/core/selectors/navModel';

// Components
import PageHeader from '../PageHeader/PageHeader';
import { Footer } from '../Footer/Footer';
import { PageContents } from './PageContents';
import { CustomScrollbar, PageToolbar, useStyles2 } from '@grafana/ui';
import { GrafanaTheme2, NavModel } from '@grafana/data';
import { Branding } from '../Branding/Branding';
import { css, cx } from '@emotion/css';
import { PageHeader2, PageSubNav } from './PageSubNav';
import appEvents from 'app/core/app_events';
import { ToggleMegaMenu } from '../NavBar/Next/MegaMenu';

interface Props extends HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
  navModel?: NavModel;
}

export interface PageType extends FC<Props> {
  Header: typeof PageHeader;
  Contents: typeof PageContents;
}

export const Page: PageType = ({ navModel, children, className, ...otherProps }) => {
  const styles = useStyles2(getStyles);

  useEffect(() => {
    if (navModel) {
      const title = getTitleFromNavModel(navModel);
      document.title = title ? `${title} - ${Branding.AppTitle}` : Branding.AppTitle;
    } else {
      document.title = Branding.AppTitle;
    }
  }, [navModel]);

  if (!navModel) {
    return null;
  }

  return (
    <div {...otherProps} className={cx(styles.wrapper, className)}>
      <PageToolbar
        parent={navModel.main.text}
        title={navModel.node.text}
        onOpenMenu={() => appEvents.publish(new ToggleMegaMenu())}
      />
      <div className={styles.scroll}>
        <CustomScrollbar autoHeightMin={'100%'}>
          <div className={styles.panes}>
            <PageSubNav model={navModel} />
            <div className={styles.pageContent}>
              <div className={styles.pageInner}>
                <h1 className={styles.pageTitle}>{navModel.node.text}</h1>
                {children}
              </div>
            </div>
          </div>
          <Footer />
        </CustomScrollbar>
      </div>
    </div>
  );
};

Page.Header = PageHeader;
Page.Contents = PageContents;

export default Page;

const getStyles = (theme: GrafanaTheme2) => ({
  wrapper: css`
    height: 100%;
    display: flex;
    flex: 1 1 0;
    flex-direction: column;
    min-height: 0;
  `,
  scroll: css`
    width: 100%;
    flex-grow: 1;
    min-height: 0;
    display: flex;
  `,
  panes: css({
    display: 'flex',
  }),
  subNav: css({
    display: 'flex',
    width: '300px',
    flexShrink: 0,
  }),
  pageTitle: css({}),
  pageContent: css({
    flexGrow: 1,
    padding: theme.spacing(3),
    background: theme.colors.background.primary,
    // display: 'flex',
    // flexDirection: 'column',
  }),
  pageInner: css({
    // maxWidth: '1200px',
  }),
});
