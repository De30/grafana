import React from 'react';
import AutoSizer from 'react-virtualized-auto-sizer';

export const Diagnostics = () => {
  return (
    <div>
      <AutoSizer disableHeight>
        {(size) => (
          <iframe
            width={size.width}
            style={{ height: '80vh' }}
            src="http://localhost:3000/d/000000003/testdata-demo-dashboard?orgId=1"
          />
        )}
      </AutoSizer>
    </div>
  );
};
