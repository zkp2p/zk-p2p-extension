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
 * To use the setInterval method to keep your service worker awake in a Chrome Extension (Manifest V3)
 * you should place it at the root level of your service worker's JavaScript file. This ensures that the
 * interval starts running as soon as the service worker is activated, and continues to run for as long
 * as the service worker remains active.
 */

let globalNotaryRequests: unknown = null;
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.action === 'REQUEST_HISTORY_BACKGROUND') {
    // console.log('Background received REQUEST_HISTORY_BACKGROUND');

    if (globalNotaryRequests) {
      sendResponse({ notaryRequests: globalNotaryRequests });

      globalNotaryRequests = null;
    } else {
      getNotaryRequests()
        .then((notaryRequests) => {
          globalNotaryRequests = notaryRequests;

          // console.log('Responding with: ', notaryRequests);

          sendResponse({ notaryRequests });
        })
        .catch((error) => {
          console.error('Error fetching notary requests:', error);

          sendResponse({ error: 'Error occurred' });
        });
    }

    return true;
  }
});
