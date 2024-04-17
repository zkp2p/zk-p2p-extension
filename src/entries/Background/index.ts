import browser from 'webextension-polyfill';

import { deleteCacheByTabId, getCacheByPlatformType } from './cache';
import { onBeforeRequest, onResponseStarted, onSendHeaders } from './handlers';
import { getNotaryRequests } from './db';


(async () => {
  browser.webRequest.onSendHeaders.addListener(
    onSendHeaders,
    {
      urls: [
        'https://wise.com/gateway/v1/payments',
        'https://wise.com/gateway/v3/profiles/*/transfers/*'
      ],
    },
    ['requestHeaders', 'extraHeaders'],
  );

  browser.webRequest.onBeforeRequest.addListener(
    onBeforeRequest,
    {
      urls: [
        'https://wise.com/gateway/v1/payments',
        'https://wise.com/gateway/v3/profiles/*/transfers/*'
      ],
    },
    ['requestBody'],
  );

  browser.webRequest.onResponseStarted.addListener(
    onResponseStarted,
    {
      urls: [
        'https://wise.com/gateway/v1/payments',
        'https://wise.com/gateway/v3/profiles/*/transfers/*'
      ],
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

// @ts-ignore
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
        if (!tabs[0] || !tabs[0].id) return;
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
        if (!tabs[0] || !tabs[0].id) return;
        return chrome.tabs.sendMessage(tabs[0].id, {
          action: 'request_transfer_history_response',
          data: { notaryRequests },
        });
      });
    });
  }

  if (message.action === 'open_sidebar_background') {
    chrome.tabs.query({ active: true, currentWindow: true }, function (tabs) {
      if (!tabs[0] || !tabs[0].id) return;
      // @ts-ignore
      chrome.sidePanel.open({ tabId: tabs[0].id });
    });
  }

  if (message.action === 'post_onramper_intent_background') {
    const { platform, onramperIntent: onramperIntentString } = message.data;
    const onramperIntent = JSON.parse(onramperIntentString);    
    const cache = getCacheByPlatformType(platform);

    cache.set(platform, onramperIntent);
  }
});

chrome.runtime.onInstalled.addListener((details) => {
  if (details.reason === "install") {
    // console.log("Extension just installed.");

    const urlPatterns = [
      "http://localhost:3000/*",
      "https://staging-testnet.zkp2p.xyz/*",
      "https://staging-app.zkp2p.xyz/*",
      "https://zkp2p.xyz/*"
    ];

    chrome.tabs.query({url: urlPatterns}, (tabs) => {
      tabs.forEach(tab => {
        if (!tab.id) return;
        chrome.scripting.executeScript({
          target: { tabId: tab.id || 0 },
          files: ["contentScript.bundle.js"]
        }).then(() => {
          console.log(`Injected contentScript.bundle.js into tab ${tab.id}`);
        }).catch(err => {
          console.error(`Failed to inject script into tab ${tab.id}: ${err.message}`);
        });
      });
    });
  }
});