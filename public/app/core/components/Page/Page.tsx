// Libraries
import React, { FC, HTMLAttributes, useEffect } from 'react';
import { getTitleFromNavModel } from 'app/core/selectors/navModel';

// Components
import PageHeader from '../PageHeader/PageHeader';
import { Footer } from '../Footer/Footer';
import { PageContents } from './PageContents';
import { CustomScrollbar, useStyles2 } from '@grafana/ui';
import { GrafanaTheme2, NavModel } from '@grafana/data';
import { Branding } from '../Branding/Branding';
import { css, cx } from '@emotion/css';
import { PageHeader2 } from '../PageHeader/PageHeader2';

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

  return (
    <div {...otherProps} className={cx(styles.wrapper, className)}>
      {navModel && <PageHeader2 model={navModel} />}
      <div className={styles.scroll}>
        <CustomScrollbar autoHeightMin={'100%'}>
          {children}
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
});
