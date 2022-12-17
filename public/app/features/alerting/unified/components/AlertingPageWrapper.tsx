import React from 'react';

import { NavModelItem, PageLayoutType } from '@grafana/data';
import { Page } from 'app/core/components/Page/Page';

interface Props {
  pageId: string;
  isLoading?: boolean;
  pageNav?: NavModelItem;
  layout?: PageLayoutType;
  toolbar?: React.ReactNode;
}

export const AlertingPageWrapper = ({
  children,
  pageId,
  pageNav,
  isLoading,
  layout,
  toolbar,
}: React.PropsWithChildren<Props>) => {
  return (
    <Page pageNav={pageNav} navId={pageId} layout={layout} toolbar={toolbar}>
      <Page.Contents isLoading={isLoading}>{children}</Page.Contents>
    </Page>
  );
};
