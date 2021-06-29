import React, { useState, useEffect, FC } from 'react';
import { useStarboard } from '../hooks';

interface StarboardNotebookProps {
  initialNotebook?: string;
}

export const StarboardNotebook: FC<StarboardNotebookProps> = ({ initialNotebook }) => {
  const [loaded, setLoaded] = useState(false);
  const { iframeRef, contentRef, sendMessage } = useStarboard({
    onMessage: (msg) => {
      if (msg.type === 'QUERY_PLEASE') {
        console.info('Running query for ', msg.payload);
        setTimeout(() => {
          sendMessage({
            type: 'HERE_IS_YOUR_DATA',
            payload: {
              queryId: msg.payload.queryId,
              data: [1, 2, 3],
            },
          });
        }, 1000);
      }
    },
  });

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
        src="http://localhost:3000/public/build/starboard-notebook/index.html"
        style={{ width: '100%', minHeight: '88vh', border: 'none' }}
      ></iframe>
      <div ref={contentRef}></div>
    </>
  );
};

export const DEFAULT_NOTEBOOK = `# %%--- [esm]
# properties:
#   run_on_load: true
#   bottom_hidden: true
#   top_hidden: true
#   locked: true
# ---%%
import { plugin as grafanaPlugin } from 'http://localhost:3000/public/build/starboard-grafana.js';
grafanaPlugin.register(runtime);
# %%--- [javascript]
# properties:
#   run_on_load: true
#   bottom_hidden: true
#   top_hidden: true
#   locked: true
# ---%%
var getTheData = function(query) {
  console.log("here is some data for your query", query);
}
# %%--- [python]
# properties:
#   run_on_load: true
#   bottom_hidden: true
#   top_hidden: true
#   locked: true
# ---%%
def get_the_data(query):
    print(f"here is some data for your query {query}")
# %% [markdown]
### More info
We can do javascript:
# %% [javascript]
console.log('Hello world!')
getTheData({expr: "node_load1"})
# %% [markdown]
We can do python:
# %% [python]
print("hi, from python")
get_the_data({"expr": "node_load1"})
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
\\end{equation}
# %% [markdown]
Eventually we want to be able to run queries using Grafana!
# %% [grafana]
node_load1`;
