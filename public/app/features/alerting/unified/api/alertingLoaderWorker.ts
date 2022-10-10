export const createWorker = () => new Worker(new URL('../sw/./alerting.worker.ts', import.meta.url));
