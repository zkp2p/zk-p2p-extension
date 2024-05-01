import browser from 'webextension-polyfill';
import { getCacheByTabId } from '@entries/Background/cache';
import mutex from '@entries/Background/mutex';
import { BackgroundActiontype, RequestLog } from '@entries/Background/rpc';
import { addRequest } from '@reducers/requests';
import { replayRequest } from '@utils/misc';
import { RevolutRequest, RevolutRequestType } from '@utils/types';

export const onSendHeaders = (details: browser.WebRequest.OnSendHeadersDetailsType) => {
  return mutex.runExclusive(async () => {
    const { method, tabId, requestId } = details;

    const fetchUrl = new URL(details.url);
    if (fetchUrl.searchParams.has('replay_request')) return; // Skip processing for replay requests

    if (method !== 'OPTIONS' && method !== 'HEAD') {
      const cache = getCacheByTabId(tabId);
      const existing = cache.get<RequestLog>(requestId);

      // Set request type
      const notarizationUrlString = details.url;
      const revolutTagEndpointRegex = new RegExp('https://app.revolut.com/api/retail/user/current');
      const revolutTransactionEndpointRegex = new RegExp('https://app.revolut.com/api/retail/transaction/\\S+');

      let requestType: RevolutRequestType = "";
      if (revolutTagEndpointRegex.test(notarizationUrlString)) { 
        requestType = RevolutRequest.PAYMENT_PROFILE;
      } else if (revolutTransactionEndpointRegex.test(notarizationUrlString)) {
        requestType = RevolutRequest.TRANSFER_DETAILS;
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

    if (method === 'OPTIONS' || method === 'HEAD') return;
    
    const fetchUrl = new URL(details.url);
    if (fetchUrl.searchParams.has('replay_request')) return; // Skip processing for replay requests

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

    if (method === 'OPTIONS' || method === 'HEAD') return;

    const fetchUrl = new URL(details.url);
    if (fetchUrl.searchParams.has('replay_request')) return; // Skip processing for replay requests

    const cache = getCacheByTabId(tabId);

    const existing = cache.get<RequestLog>(requestId);

    // Set request type
    const notarizationUrlString = details.url;
    const revolutTagEndpointRegex = new RegExp('https://app.revolut.com/api/retail/user/current');
    const revolutTransactionEndpointRegex = new RegExp('https://app.revolut.com/api/retail/transaction/\\S+');

    let requestType: RevolutRequestType = "";
    if (revolutTagEndpointRegex.test(notarizationUrlString)) { 
      requestType = RevolutRequest.PAYMENT_PROFILE;
    } else if (revolutTransactionEndpointRegex.test(notarizationUrlString)) {
      requestType = RevolutRequest.TRANSFER_DETAILS;
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

    const response = await replayRequest(newLog);
    // console.log('response', response);

    const newLogWithResponseBody: RequestLog = {
      ...newLog,
      responseBody: response.text,
    };

    cache.set(requestId, newLogWithResponseBody);

    chrome.runtime.sendMessage({
      type: BackgroundActiontype.push_action,
      data: {
        tabId: details.tabId,
        request: newLogWithResponseBody,
      },
      action: addRequest(newLogWithResponseBody),
    });
  });
};
