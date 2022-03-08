import React from 'react';
import AutoSizer from 'react-virtualized-auto-sizer';

export const Diagnostics = () => {
  return (
    <div>
      <AutoSizer disableHeight>
        {(size) => (
          <>
            <div
              style={{
                position: 'absolute',
                width: '50px',
                height: '80vh',
                background: '#111218',
                left: '0px',
                top: '0px',
                zIndex: '999',
                display: 'block',
                color: '#fff',
              }}
            />
            <div
              style={{
                position: 'absolute',
                width: size.width,
                height: '50px',
                background: '#111218',
                left: '0px',
                top: '0px',
                zIndex: '999',
                display: 'block',
                color: '#fff',
              }}
            />
            <iframe
              width={size.width}
              style={{ height: '80vh' }}
              src="http://localhost:3000/d/000000003/testdata-demo-dashboard?orgId=1"
            />
          </>
        )}
      </AutoSizer>
    </div>
  );
};
