import browser from 'webextension-polyfill';

import { getCacheByTabId } from './cache';
import mutex from './mutex';
import { BackgroundActiontype, RequestLog } from './rpc';
import { addRequest } from '../../reducers/requests';
import { WiseRequest, WiseRequestType } from '@utils/types';

export const onSendHeaders = (details: browser.WebRequest.OnSendHeadersDetailsType) => {
  return mutex.runExclusive(async () => {
    const { method, tabId, requestId } = details;

    if (method !== 'OPTIONS') {
      const cache = getCacheByTabId(tabId);
      const existing = cache.get<RequestLog>(requestId);

      // Set request type
      const notarizationUrlString = details.url;
      const wiseTagEndpointRegex = new RegExp('https://wise.com/gateway/v1/payments');
      const transferEndpointRegex = new RegExp('https://wise.com/gateway/v3/profiles/\\d+/transfers/\\d+');

      let requestType: WiseRequestType = "";
      if (wiseTagEndpointRegex.test(notarizationUrlString)) {
        requestType = WiseRequest.WISETAG_REGISTRATION;
      } else if (transferEndpointRegex.test(notarizationUrlString)) {
        requestType = WiseRequest.TRANSFERS;
      }

      cache.set(requestId, {
        ...existing,
        method: details.method as 'GET' | 'POST',
        type: details.type,
        url: details.url,
        initiator: details.initiator || null,
        requestHeaders: details.requestHeaders || [],
        tabId: tabId,
        requestId: requestId,
        requestType,
      });
    }
  });
};

export const onBeforeRequest = (details: browser.WebRequest.OnBeforeRequestDetailsType) => {
  mutex.runExclusive(async () => {
    const { method, requestBody, tabId, requestId } = details;

    if (method === 'OPTIONS') return;

    if (requestBody) {
      const cache = getCacheByTabId(tabId);
      const existing = cache.get<RequestLog>(requestId);

      if (requestBody.raw && requestBody.raw[0]?.bytes) {
        try {
          cache.set(requestId, {
            ...existing,
            requestBody: Buffer.from(requestBody.raw[0].bytes).toString('utf-8'),
          });
        } catch (e) {
          console.error(e);
        }
      } else if (requestBody.formData) {
        cache.set(requestId, {
          ...existing,
          formData: requestBody.formData,
        });
      }
    }
  });
};

export const onResponseStarted = (details: browser.WebRequest.OnResponseStartedDetailsType) => {
  mutex.runExclusive(async () => {
    const { method, responseHeaders, tabId, requestId } = details;

    if (method === 'OPTIONS') return;

    const cache = getCacheByTabId(tabId);

    const existing = cache.get<RequestLog>(requestId);

    // Set request type
    const notarizationUrlString = details.url;
    const wiseTagEndpointRegex = new RegExp('https://wise.com/gateway/v1/payments');
    const transferEndpointRegex = new RegExp('https://wise.com/gateway/v3/profiles/\\d+/transfers/\\d+');

    let requestType: WiseRequestType = "";
    if (wiseTagEndpointRegex.test(notarizationUrlString)) {
      requestType = WiseRequest.WISETAG_REGISTRATION;
    } else if (transferEndpointRegex.test(notarizationUrlString)) {
      requestType = WiseRequest.TRANSFERS;
    }
    
    const newLog: RequestLog = {
      requestHeaders: [],
      ...existing,
      method: details.method,
      type: details.type,
      url: details.url,
      initiator: details.initiator || null,
      tabId: tabId,
      requestId: requestId,
      responseHeaders,
      timestamp: Date.now(),
      requestType,
    };

    cache.set(requestId, newLog);

    chrome.runtime.sendMessage({
      type: BackgroundActiontype.push_action,
      data: {
        tabId: details.tabId,
        request: newLog,
      },
      action: addRequest(newLog),
    });
  });
};
