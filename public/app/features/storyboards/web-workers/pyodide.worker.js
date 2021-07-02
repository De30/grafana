importScripts('https://cdn.jsdelivr.net/pyodide/v0.17.0/full/pyodide.js');

async function loadPyodideAndPackages() {
  await loadPyodide({ indexURL: 'https://cdn.jsdelivr.net/pyodide/v0.17.0/full/' });
  await self.pyodide.loadPackage(['numpy', 'pandas', 'pytz']);
  await self.pyodide.runPythonAsync(`def DF(df):
    import pandas
    return pandas.DataFrame({
      field.name: list(field.values)
      for field in df[0].fields
    })`);
}
let pyodideReadyPromise = loadPyodideAndPackages();

self.onmessage = async (event) => {
  await pyodideReadyPromise;
  const { python, ...context } = event.data;

  for (const key of Object.keys(context)) {
    console.log('Loading %s: %o', key, context[key]);
    if (context[key]) {
      self[key] = context[key].value;
    }
  }

  try {
    const results = await self.pyodide.runPythonAsync(python);
    console.info('WORKER RESULT: %o', results);
    self.postMessage({
      results,
    });
  } catch (error) {
    console.error('ERROR: %o', error);
    self.postMessage({ error: error.message });
  }
};
