export const debugLog = (...args: any[]) => {
  if (process.env.DEBUG) {
    console.log(...args);
  }
};
