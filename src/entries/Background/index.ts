import browser from 'webextension-polyfill';

import { deleteCacheByTabId } from './cache';
import { onBeforeRequest, onResponseStarted, onSendHeaders } from './handlers';
import { getNotaryRequests } from './db';
import store from '../../utils/store';
import { get } from 'http';

(async () => {
  browser.webRequest.onSendHeaders.addListener(
    onSendHeaders,
    {
      urls: ['<all_urls>'],
    },
    ['requestHeaders', 'extraHeaders'],
  );

  browser.webRequest.onBeforeRequest.addListener(
    onBeforeRequest,
    {
      urls: ['<all_urls>'],
    },
    ['requestBody'],
  );

  browser.webRequest.onResponseStarted.addListener(
    onResponseStarted,
    {
      urls: ['<all_urls>'],
    },
    ['responseHeaders', 'extraHeaders'],
  );

  browser.tabs.onRemoved.addListener((tabId) => {
    deleteCacheByTabId(tabId);
  });

  const { initRPC } = await import('./rpc');
  await createOffscreenDocument();
  initRPC();
})();

/*
 * Create offscreen document for background processing and multi-threading
 */

let creatingOffscreen: any;
async function createOffscreenDocument() {
  const offscreenUrl = browser.runtime.getURL('offscreen.html');
  // @ts-ignore
  const existingContexts = await browser.runtime.getContexts({
    contextTypes: ['OFFSCREEN_DOCUMENT'],
    documentUrls: [offscreenUrl],
  });

  if (existingContexts.length > 0) {
    return;
  }

  if (creatingOffscreen) {
    await creatingOffscreen;
  } else {
    creatingOffscreen = (chrome as any).offscreen.createDocument({
      url: 'offscreen.html',
      reasons: ['WORKERS'],
      justification: 'workers for multithreading',
    });
    await creatingOffscreen;
    creatingOffscreen = null;
  }
}

/*
 * Set panel behavior on action bar item click: https://developer.chrome.com/docs/extensions/reference/api/sidePanel
 */

chrome.sidePanel
  .setPanelBehavior({ openPanelOnActionClick: true })
  .catch((error: any) => console.error(error));

/*
 * Janky way of responding to content script messages by sending messages back
 */

chrome.runtime.onMessage.addListener((message) => {
  if (message.action === 'request_history_background') {
    getNotaryRequests().then((notaryRequests) => {
      // console.log(new Date().toISOString(), 'Successfully fetched:', notaryRequests);

      chrome.tabs.query({ active: true, currentWindow: true }, function (tabs) {
        return chrome.tabs.sendMessage(tabs[0].id, {
          action: 'request_profile_history_response',
          data: { notaryRequests },
        });
      });
    });
  }

  if (message.action === 'request_transfer_history_background') {
    getNotaryRequests().then((notaryRequests) => {
      // console.log(new Date().toISOString(), 'Successfully fetched:', notaryRequests);

      chrome.tabs.query({ active: true, currentWindow: true }, function (tabs) {
        return chrome.tabs.sendMessage(tabs[0].id, {
          action: 'request_transfer_history_response',
          data: { notaryRequests },
        });
      });
    });
  }
});
