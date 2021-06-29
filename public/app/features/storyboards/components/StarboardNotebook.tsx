import React, { useState, useEffect, FC } from 'react';
import { useStarboard } from '../hooks';

interface StarboardNotebookProps {
  initialNotebook?: string;
}

export const StarboardNotebook: FC<StarboardNotebookProps> = ({ initialNotebook }) => {
  const [loaded, setLoaded] = useState(false);
  const { iframeRef, contentRef, sendMessage } = useStarboard({});

  useEffect(() => {
    if (!loaded) {
      return;
    }
    console.info('* Sending init data');
    sendMessage({
      type: 'NOTEBOOK_SET_INIT_DATA',
      payload: {
        content: initialNotebook || DEFAULT_NOTEBOOK,
      },
    });
  }, [loaded, initialNotebook, sendMessage]);

  return (
    <>
      <iframe
        onLoad={(e) => {
          console.info('* did load', e);
          setLoaded(true);
        }}
        ref={iframeRef}
        src="https://unpkg.com/starboard-notebook@0.12.0/dist/index.html"
        style={{ width: '100%', minHeight: '100vh' }}
      ></iframe>
      <div ref={contentRef}></div>
    </>
  );
};

const DEFAULT_NOTEBOOK = `# %% [markdown]
### More info
We can do javascript:
# %% [javascript]
console.log('Hello world!')
# %% [markdown]
We can do python:
# %% [python]
print("hi, from python")
# %% [markdown]
Math should be no issue:
# %% [latex]
\\begin{equation}
\\begin{aligned}
\\frac{\\partial\\mathcal{D}}{\\partial t} \\quad & = \\quad \\nabla\\times\\mathcal{H},   & \\quad \\text{(Loi de Faraday)} \\\\[5pt]
\\frac{\\partial\\mathcal{B}}{\\partial t} \\quad & = \\quad -\\nabla\\times\\mathcal{E},  & \\quad \\text{(Loi d'Ampère)}   \\\\[5pt]
\\nabla\\cdot\\mathcal{B}                 \\quad & = \\quad 0,                         & \\quad \\text{(Loi de Gauss)}  \\\\[5pt]
\\nabla\\cdot\\mathcal{D}                 \\quad & = \\quad 0.                         & \\quad \\text{(Loi de Colomb)}
\\end{aligned}
\\end{equation}`;
