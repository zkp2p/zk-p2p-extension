import NodeCache from 'node-cache';

let RequestsLogs: {
  [tabId: string]: NodeCache;
} = {};

let OnramperIntent: {
  [platformType: string]: NodeCache;
} = {};

export const deleteCacheByTabId = (tabId: number) => {
  delete RequestsLogs[tabId];
};

export const getCacheByTabId = (tabId: number): NodeCache => {
  RequestsLogs[tabId] =
    RequestsLogs[tabId] ||
    new NodeCache({
      stdTTL: 60 * 5, // default 5m TTL
      maxKeys: 1000000,
    });

  return RequestsLogs[tabId];
};

export const clearRequestsLogsCache = () => {
  RequestsLogs = {};
};

export const deleteCacheByPlatformType = (platformType: string) => {
  delete OnramperIntent[platformType];
};

export const getCacheByPlatformType = (platformType: string): NodeCache => {
  OnramperIntent[platformType] =
    OnramperIntent[platformType] ||
    new NodeCache({
      stdTTL: 60 * 5, // default 5m TTL
      maxKeys: 1000000,
    });

  return OnramperIntent[platformType];
};

export const clearOnramperIntentCache = () => {
  OnramperIntent = {};
};