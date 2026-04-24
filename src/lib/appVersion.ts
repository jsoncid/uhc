// These are injected at build time via vite.config.ts define option
declare const __BUILD_TIME__: string;
declare const __BUILD_HASH__: string;

export const APP_VERSION = typeof __BUILD_TIME__ !== 'undefined' ? __BUILD_TIME__ : 'dev';
export const APP_BUILD_HASH = typeof __BUILD_HASH__ !== 'undefined' ? __BUILD_HASH__ : 'dev';

export const isVersionMismatch = (): boolean => {
  const cachedVersion = sessionStorage.getItem('app_version');
  if (!cachedVersion) return false;
  return cachedVersion !== APP_VERSION;
};

export const setAppVersion = (): void => {
  sessionStorage.setItem('app_version', APP_VERSION);
};

export const clearAppVersion = (): void => {
  sessionStorage.removeItem('app_version');
};