import browser from 'webextension-polyfill';
import { clearRequestsLogsCache, getCacheByTabId, getCacheByPlatformType } from './cache';
import { addRequestHistory } from '../../reducers/history';
import {
  getNotaryRequests,
  addNotaryRequest,
  addNotaryRequestProofs,
  getNotaryRequest,
  setNotaryRequestStatus,
  setNotaryRequestError,
  setNotaryRequestVerification,
  removeNotaryRequest,
} from './db';
import { OnRamperIntent, RevolutRequestType } from '@utils/types';

export enum BackgroundActiontype {
  get_requests = 'get_requests',
  clear_requests = 'clear_requests',
  push_action = 'push_action',
  get_prove_requests = 'get_prove_requests',
  prove_request_start = 'prove_request_start',
  process_prove_request = 'process_prove_request',
  finish_prove_request = 'finish_prove_request',
  verify_prove_request = 'verify_prove_request',
  verify_proof = 'verify_proof',
  delete_prove_request = 'delete_prove_request',
  retry_prove_request = 'retry_prove_request',
  get_onramper_intent = 'get_onramper_intent',
}

export type BackgroundAction = {
  type: BackgroundActiontype;
  data?: any;
  meta?: any;
  error?: boolean;
};

export type RequestLog = {
  requestId: string;
  tabId: number;
  method: string;
  type: string;
  url: string;
  initiator: string | null;
  requestHeaders: browser.WebRequest.HttpHeaders;
  requestBody?: string;
  formData?: {
    [k: string]: string[];
  };
  responseHeaders?: browser.WebRequest.HttpHeaders;
  timestamp: number;
  requestType: RevolutRequestType;
  responseBody?: string;
};

export type RequestHistory = {
  id: string;
  url: string;
  method: string;
  headers: { [key: string]: string };
  body?: string;
  maxSentData: number;
  maxRecvData: number;
  notaryUrl: string;
  websocketProxyUrl: string;
  status: '' | 'pending' | 'success' | 'error';
  error?: any;
  proof?: { session: any; substrings: any };
  requestBody?: any;
  verification?: {
    sent: string;
    recv: string;
  };
  secretHeaders?: string[];
  secretResps?: string[];
  metadata?: string[];
  originalTabId?: number | null;
  requestType: RevolutRequestType;
};

export const initRPC = () => {
  browser.runtime.onMessage.addListener(async (request, sender, sendResponse) => {
    switch (request.type) {
      case BackgroundActiontype.get_requests:
        return handleGetRequests(request, sendResponse);

      case BackgroundActiontype.clear_requests:
        clearRequestsLogsCache();
        return sendResponse();

      case BackgroundActiontype.get_prove_requests:
        return handleGetProveRequests(request, sendResponse);

      case BackgroundActiontype.finish_prove_request:
        return handleFinishProveRequest(request, sendResponse);

      case BackgroundActiontype.delete_prove_request:
        await removeNotaryRequest(request.data);
        return sendResponse();

      case BackgroundActiontype.retry_prove_request:
        return handleRetryProveReqest(request, sendResponse);

      case BackgroundActiontype.prove_request_start:
        return handleProveRequestStart(request, sendResponse);

      case BackgroundActiontype.get_onramper_intent:
        return handleGetOnramperIntent(request, sendResponse);

      default:
        break;
    }
  });
};

function handleGetRequests(request: BackgroundAction, sendResponse: (data?: any) => void) {
  const cache = getCacheByTabId(request.data);
  const keys = cache.keys() || [];
  const data = keys.map((key) => cache.get(key));
  return data;
}

async function handleGetProveRequests(
  request: BackgroundAction,
  sendResponse: (data?: any) => void,
) {
  const reqs = await getNotaryRequests();
  for (const req of reqs) {
    await browser.runtime.sendMessage({
      type: BackgroundActiontype.push_action,
      data: {
        tabId: 'background',
      },
      action: addRequestHistory(req),
    });
  }
  return sendResponse();
}

async function handleFinishProveRequest(
  request: BackgroundAction,
  sendResponse: (data?: any) => void,
) {
  const { id, proof, error, verification, originalTabId } = request.data;

  if (proof) {
    const newReq = await addNotaryRequestProofs(id, proof);
    if (!newReq) return;

    await browser.runtime.sendMessage({
      type: BackgroundActiontype.push_action,
      data: {
        tabId: 'background',
      },
      action: addRequestHistory(await getNotaryRequest(id)),
    });

    console.log('originalTabId', originalTabId);

    // Close the active tab and switch back to the original tab
    // if (originalTabId) {
    //   await browser.tabs.update(originalTabId, { active: true });
    // }
  }

  if (error) {
    const newReq = await setNotaryRequestError(id, error);
    if (!newReq) return;

    await browser.runtime.sendMessage({
      type: BackgroundActiontype.push_action,
      data: {
        tabId: 'background',
      },
      action: addRequestHistory(await getNotaryRequest(id)),
    });
  }

  if (verification) {
    const newReq = await setNotaryRequestVerification(id, verification);
    if (!newReq) return;

    await browser.runtime.sendMessage({
      type: BackgroundActiontype.push_action,
      data: {
        tabId: 'background',
      },
      action: addRequestHistory(await getNotaryRequest(id)),
    });
  }


  return sendResponse();
}

async function handleRetryProveReqest(
  request: BackgroundAction,
  sendResponse: (data?: any) => void,
) {
  const { id, notaryUrl, websocketProxyUrl, metadata, originalTabId } = request.data;

  await setNotaryRequestError(id, null);
  await setNotaryRequestStatus(id, 'pending');

  const req = await getNotaryRequest(id);

  await browser.runtime.sendMessage({
    type: BackgroundActiontype.push_action,
    data: {
      tabId: 'background',
    },
    action: addRequestHistory(req),
  });

  await browser.runtime.sendMessage({
    type: BackgroundActiontype.process_prove_request,
    data: {
      ...req,
      notaryUrl,
      websocketProxyUrl,
      metadata,
      originalTabId
    },
  });

  return sendResponse();
}

async function handleProveRequestStart(
  request: BackgroundAction,
  sendResponse: (data?: any) => void,
) {
  const {
    url,
    method,
    headers,
    body,
    maxSentData,
    maxRecvData,
    notaryUrl,
    websocketProxyUrl,
    secretHeaders,
    secretResps,
    metadata,
    originalTabId,
    requestType,
  } = request.data;

  const { id } = await addNotaryRequest(Date.now(), {
    url,
    method,
    headers,
    body,
    maxSentData,
    maxRecvData,
    notaryUrl,
    websocketProxyUrl,
    secretHeaders,
    secretResps,
    metadata,
    requestType,
  });

  await setNotaryRequestStatus(id, 'pending');

  await browser.runtime.sendMessage({
    type: BackgroundActiontype.push_action,
    data: {
      tabId: 'background',
    },
    action: addRequestHistory(await getNotaryRequest(id)),
  });

  await browser.runtime.sendMessage({
    type: BackgroundActiontype.process_prove_request,
    data: {
      id,
      url,
      method,
      headers,
      body,
      maxSentData,
      maxRecvData,
      notaryUrl,
      websocketProxyUrl,
      secretHeaders,
      secretResps,
      metadata,
      originalTabId,
      requestType,
    },
  });

  return sendResponse();
}

async function handleGetOnramperIntent(
  request: BackgroundAction,
  sendResponse: (data?: any) => void,
) {
  const platform = request.data;
  const cache = getCacheByPlatformType(platform);
  const onramperIntent: OnRamperIntent = cache.get(platform) as OnRamperIntent;

  return onramperIntent;
}