import browser from 'webextension-polyfill';
import deepEqual from 'fast-deep-equal';
import { useSelector } from 'react-redux';

import { type RequestLog, type RequestHistory } from '../entries/Background/rpc';
import { AppRootState } from './index';
import { get, NOTARY_API_LS_KEY, PROXY_API_LS_KEY } from '../utils/storage';
import { BackgroundActiontype } from '../entries/Background/rpc';

enum ActionType {
  '/requests/setRequests' = '/requests/setRequests',
  '/requests/addRequest' = '/requests/addRequest',
  '/requests/setActiveTab' = '/requests/setActiveTab',
  '/requests/deleteRequest' = '/requests/deleteRequest',
}

type Action<payload> = {
  type: ActionType;
  payload?: payload;
  error?: boolean;
  meta?: any;
};

type State = {
  map: {
    [requestId: string]: RequestLog;
  };
  activeTab: chrome.tabs.Tab | null;
};

const initialState: State = {
  map: {},
  activeTab: null,
};

export const setRequests = (requests: RequestLog[]): Action<RequestLog[]> => ({
  type: ActionType['/requests/setRequests'],
  payload: requests,
});

export const notarizeRequest = (options: RequestHistory) => async () => {
  const notaryUrl = await get(NOTARY_API_LS_KEY);
  const websocketProxyUrl = await get(PROXY_API_LS_KEY);

  chrome.runtime.sendMessage<any, string>({
    type: BackgroundActiontype.prove_request_start,
    data: {
      url: options.url,
      method: options.method,
      headers: options.headers,
      body: options.body,
      maxSentData: options.maxSentData,
      maxRecvData: options.maxRecvData,
      secretHeaders: options.secretHeaders,
      secretResps: options.secretResps,
      notaryUrl,
      websocketProxyUrl,
      metadata: options.metadata,
      originalTabId: options.originalTabId,
      requestType: options.requestType,
    },
  });
};

export const deleteRequestLog = (id: string) => {
  chrome.runtime.sendMessage<any, string>({
    type: BackgroundActiontype.delete_request,
    data: id,
  });

  return {
    type: ActionType['/requests/deleteRequest'],
    payload: id,
  };
};

export const setActiveTab = (
  activeTab: browser.Tabs.Tab | null,
): Action<browser.Tabs.Tab | null> => ({
  type: ActionType['/requests/setActiveTab'],
  payload: activeTab,
});

export const addRequest = (request: RequestLog): Action<RequestLog> => ({
  type: ActionType['/requests/addRequest'],
  payload: request,
});

export default function requests(state = initialState, action: Action<any>): State {
  switch (action.type) {
    case ActionType['/requests/setRequests']:
      return {
        ...state,
        map: {
          ...(action?.payload || []).reduce(
            (acc: { [requestId: string]: RequestLog }, req: RequestLog) => {
              if (req) {
                acc[req.requestId] = req;
              }
              return acc;
            },
            {},
          ),
        },
      };

    case ActionType['/requests/setActiveTab']:
      return {
        ...state,
        activeTab: action.payload,
      };

    case ActionType['/requests/deleteRequest']:
      const reqId: string = action.payload;
      const newMap = { ...state.map };
      delete newMap[reqId];
      return {
        ...state,
        map: newMap,
      };

    case ActionType['/requests/addRequest']:
      return {
        ...state,
        map: {
          ...state.map,
          [action.payload.requestId]: action.payload,
        },
      };
      
    default:
      return state;
  }
}

export const useRequests = (order: 'ascending' | 'descending' = 'ascending'): RequestLog[] => {
  return useSelector((state: AppRootState) => {
    const requests = Object.values(state.requests.map);
    if (order === 'descending') {
      return requests.sort((a, b) => b.timestamp - a.timestamp);
    }
    return requests.sort((a, b) => a.timestamp - b.timestamp);
  }, deepEqual);
};

export const useRequest = (requestId?: string): RequestLog | null => {
  return useSelector((state: AppRootState) => {
    console.log('state.requests.map', state.requests.map);
    return requestId ? state.requests.map[requestId] : null;
  }, deepEqual);
};

export const useActiveTab = (): chrome.tabs.Tab | null => {
  return useSelector((state: AppRootState) => {
    return state.requests.activeTab;
  }, deepEqual);
};

export const useActiveTabUrl = (): URL | null => {
  return useSelector((state: AppRootState) => {
    const activeTab = state.requests.activeTab;
    return activeTab?.url ? new URL(activeTab.url) : null;
  }, deepEqual);
};
