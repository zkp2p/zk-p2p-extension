import { RevolutRequest } from '@utils/types';


window.onerror = (error) => {
  // console.log('error');
  // console.log(error);
};

/*
 * Listeners
 */

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

  if (message.action === 'highlight_transaction') {
    addZkp2pTooltip();
  }
});

/*
 * Revolut Transaction Highlighting
 */

function waitForElements(selector: any, callback: any) {
  const interval = setInterval(() => {
    console.log('Waiting for elements...');

    const elements = document.querySelectorAll(selector);
    if (elements.length) {
      clearInterval(interval);

      callback(elements);
    }
  }, 100);
}

const transactionBlockSelector = '[data-testid="homeWidget"] > div:nth-child(2)'; // Testing4

/*
 * New
 */

function addZkp2pTooltip() {
  waitForElements(transactionBlockSelector, (transactionBlock: NodeListOf<Element>) => {
    const containerDiv = transactionBlock[0];
    const parentDiv = containerDiv.parentElement;
    if (containerDiv && parentDiv) {
      const spans = containerDiv.querySelectorAll('span');
      if (spans.length > 1) {
        const targetSpan = spans[1];

        const uniqueTooltipId = `tooltip-1`;
        const tooltipSelector = targetSpan.querySelector(`#${uniqueTooltipId}`);

        if (!tooltipSelector) {
          parentDiv.style.position = 'relative';

          targetSpan.textContent = '';

          const tooltipHover = document.createElement('div');
          tooltipHover.className = 'custom-tooltip-hover';

          const tooltipText = document.createElement('span');
          tooltipText.className = 'tooltip-text';
          tooltipText.textContent = `Select the completed ZKP2P transaction and complete the flow in the sidebar.
            You may need to change the currency account to see the transaction.`;
          tooltipHover.appendChild(tooltipText);

          document.body.appendChild(tooltipHover);

          const tooltip = document.createElement('div');
          tooltip.id = uniqueTooltipId;
          tooltip.className = 'custom-tooltip';

          const icon = document.createElement('img');
          icon.src = chrome.runtime.getURL('icon-48.png');
          icon.alt = 'Icon';
          icon.className = 'custom-tooltip-icon';
          tooltip.appendChild(icon);

          targetSpan.style.display = 'flex';
          targetSpan.style.alignItems = 'center';
          targetSpan.appendChild(tooltip);

          document.querySelectorAll('.custom-tooltip').forEach(element => {
            element.addEventListener('mouseenter', function(this: HTMLElement) {
              tooltipHover.style.opacity = '1';
              const rect = this.getBoundingClientRect();
              tooltipHover.style.left = `${rect.left + window.scrollX + this.offsetWidth - 8}px`;
              tooltipHover.style.top = `${rect.top + window.scrollY + this.offsetHeight - 8}px`;
            });

            element.addEventListener('mouseleave', function() {
              tooltipHover.style.opacity = '0';
            });
          });
        }
      }
    }
  });
}

(async () => {
  console.log('Content script works!');
  console.log('Must reload extension for modifications to take effect.');
})();
