import { RevolutRequest } from '@utils/types';

window.onerror = (error) => {
  // console.log('error');
  // console.log(error);
};

function waitForElements(selector: any, callback: any) {
  const interval = setInterval(() => {
    const elements = document.querySelectorAll(selector);
    if (elements.length) {
      clearInterval(interval);
      callback(elements);
    }
  }, 100);
}

function handleFoundElements(elements: any) {
  const firstTransactionButton = elements[0].querySelector('[aria-label="latest-transactions-block"] div button');
  if (firstTransactionButton) {
    // Highlight the first row
    firstTransactionButton.classList.add('highlighted-row');
    
    // Add zkp2p-logo on pill tooltip to the right of the row
    const parentDiv = firstTransactionButton.parentElement;
    if (parentDiv) {
      parentDiv.style.position = 'relative';

      const tooltip = document.createElement('div');
      tooltip.className = 'custom-tooltip';

      const icon = document.createElement('img');
      icon.src = chrome.runtime.getURL('icon-48.png');
      icon.alt = 'Icon';
      icon.className = 'custom-tooltip-icon';
      tooltip.appendChild(icon);

      tooltip.style.position = 'absolute';
      tooltip.style.left = `${firstTransactionButton.offsetWidth}px`;
      tooltip.style.top = '50%';
      tooltip.style.transform = 'translateY(-50%)';

      parentDiv.appendChild(tooltip);
    }
  } else {
    console.log("No button found in the first transaction.");
  }
}

const selector = '[aria-label="latest-transactions-block"]';
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => waitForElements(selector, handleFoundElements));
} else {
  waitForElements(selector, handleFoundElements);
}

window.addEventListener('message', function (event) {
  if (event.source != window) {
    return;
  }

  if (event.data.type && event.data.type == 'fetch_extension_version') {
    // console.log(new Date().toISOString(), 'Content received fetch_extension_version');

    window.postMessage(
      {
        type: 'extension_version_response',
        status: 'loaded',
        version: '0.0.1',
      },
      '*',
    );
  }

  if (event.data.type && event.data.type == 'fetch_profile_request_history') {
    // console.log(new Date().toISOString(), 'Content received fetch_profile_request_history');

    chrome.runtime.sendMessage({ action: 'request_history_background' });
  }

  if (event.data.type && event.data.type == 'fetch_transfer_request_history') {
    // console.log('Content received fetch_transfer_request_history');

    chrome.runtime.sendMessage({ action: 'request_transfer_history_background' });
  }

  if (event.data.type && event.data.type == 'open_sidebar_registration') {
    // console.log('Content received open_sidebar_registration');

    chrome.runtime.sendMessage({ action: 'open_sidebar_registration_background' });
  }

  if (event.data.type && event.data.type == 'open_sidebar_onramp') {
    // console.log('Content received open_sidebar_onramp');

    chrome.runtime.sendMessage({ action: 'open_sidebar_onramp_background' });
  }

  if (event.data.type && event.data.type == 'post_onramper_intent') {
    // console.log('Content received post_onramper_intent');

    chrome.runtime.sendMessage({ action: 'post_onramper_intent_background', data: event.data });
  }
});

/*
 * Background chrome message listeners
 */

chrome.runtime.onMessage.addListener((message) => {
  if (message.action === 'request_profile_history_response') {

    let filteredResponse = [];
    if (message.data.notaryRequests && message.data.notaryRequests.length > 0) {
      filteredResponse = message.data.notaryRequests.filter(
        (item: { status: string; requestType: string }) =>
          item.status === 'success' && item.requestType === RevolutRequest.PAYMENT_PROFILE,
      );
    }

    window.postMessage(
      {
        type: 'profile_request_history_response',
        status: 'loaded',
        requestHistory: { notaryRequests: filteredResponse },
      },
      '*',
    );
  }

  if (message.action === 'request_transfer_history_response') {
    let filteredResponse = [];
    if (message.data.notaryRequests && message.data.notaryRequests.length > 0) {
      filteredResponse = message.data.notaryRequests.filter(
        (item: { status: string; requestType: string }) =>
          item.status === 'success' && item.requestType === RevolutRequest.TRANSFER_DETAILS,
      );
    }

    window.postMessage(
      {
        type: 'transfer_request_history_response',
        status: 'loaded',
        requestHistory: { notaryRequests: filteredResponse },
      },
      '*',
    );
  }
});

(async () => {
  console.log('Content script works!');
  console.log('Must reload extension for modifications to take effect.');
})();
