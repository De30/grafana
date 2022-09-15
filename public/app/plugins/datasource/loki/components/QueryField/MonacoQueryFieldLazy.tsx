import React, { Suspense } from 'react';

import { Props } from './MonacoQueryField';

const Field = React.lazy(() => import(/* webpackChunkName: "loki-query-field" */ './MonacoQueryField'));

export const MonacoQueryFieldLazy = (props: Props) => {
  return (
    <Suspense fallback={() => <div>Loading editor</div>}>
      <Field {...props} />
    </Suspense>
  );
};
