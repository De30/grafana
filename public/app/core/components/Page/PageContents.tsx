// Libraries
import React, { Component } from 'react';

// Components
import PageLoader from '../PageLoader/PageLoader';

interface Props {
  isLoading?: boolean;
  children: React.ReactNode;
}

class PageContents extends Component<Props> {
  render() {
    const { isLoading } = this.props;

    return (
      <div className="page-body">
        <div class="page-container">{isLoading ? <PageLoader /> : this.props.children}</div>
      </div>
    );
  }
}

export default PageContents;
