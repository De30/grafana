// Libraries
import React, { Component } from 'react';
import { getTitleFromNavModel } from 'app/core/selectors/navModel';

// Components
import PageHeader, { Navigation } from '../PageHeader/PageHeader';
import { Footer } from '../Footer/Footer';
import PageContents from './PageContents';
import { CustomScrollbar, stylesFactory } from '@grafana/ui';
import { NavModel } from '@grafana/data';
import { isEqual } from 'lodash';
import { Branding } from '../Branding/Branding';
import { css } from 'emotion';
import { config } from 'app/core/config';

interface Props {
  children: React.ReactNode;
  navModel: NavModel;
}

class Page extends Component<Props> {
  static Header = PageHeader;
  static Contents = PageContents;

  componentDidMount() {
    this.updateTitle();
  }

  componentDidUpdate(prevProps: Props) {
    if (!isEqual(prevProps.navModel, this.props.navModel)) {
      this.updateTitle();
    }
  }

  updateTitle = () => {
    const title = this.getPageTitle;
    document.title = title ? title + ' - ' + Branding.AppTitle : Branding.AppTitle;
  };

  get getPageTitle() {
    const { navModel } = this.props;
    if (navModel) {
      return getTitleFromNavModel(navModel) || undefined;
    }
    return undefined;
  }

  render() {
    const { navModel } = this.props;
    const styles = getStyles();

    return (
      <div className={styles.wrapper}>
        <div className={styles.navigation}>
          <Navigation model={navModel} />
        </div>
        <div className={styles.content}>
          <CustomScrollbar autoHeightMin={'100%'} className="custom-scrollbar--page">
            <div className="page-scrollbar-content">
              <PageHeader model={navModel} />
              {this.props.children}
              <Footer />
            </div>
          </CustomScrollbar>
        </div>
      </div>
    );
  }
}

export const getStyles = stylesFactory(() => {
  return {
    wrapper: css`
      display: flex;
      flex-direction: row;
      height: 100%;
      width: 100%;
      flex: 1 1 0;
      padding: 16px;
    `,
    navigation: css`
      display: flex;
      min-width: 200px;
      flex-grow: 0;
      flex: 0 1 0%;
      margin-right: 24px;
    `,
    content: css`
      flex: 1 1 100%;
      max-width: 1200px;
      margin-left: auto;
      margin-right: auto;
    `,
  };
});

export default Page;
