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
    console.log('Content received post_onramper_intent');

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

    // TODO: update to allow multiple currencies
    highlightTransactionByAmount(message.data.fiatToSend);
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

const transactionRowsSelector = '[aria-label="latest-transactions-block"]';

/*
 * New
 */

function highlightTransactionByAmount(amountText: string) {
  console.log('highlightTransactionByAmount:', amountText);

  waitForElements(transactionRowsSelector, (transactionBlock: NodeListOf<Element>) => {
    const transactionRows = transactionBlock[0].querySelectorAll('div');
    transactionRows.forEach((transactionRow) => {
      const spanForTransactionAmount = transactionRow.querySelector('div + span + span > span > div > span');
      
      if (spanForTransactionAmount) {
        const spanTextContent = spanForTransactionAmount.textContent;
        console.log('spanTextContent:', spanTextContent);

        if (spanTextContent) {
          const spanTextContentSubstring = spanTextContent.replace(/[^\d.]/g, '');
          console.log('spanTextContentSubstring:', spanTextContentSubstring);
          console.log('amountText:', amountText);
          
          if (spanTextContentSubstring === amountText) {
            console.log('textMatches:', spanTextContent);
  
            const transactionRowButton = transactionRow.querySelector('button') as HTMLElement;
            if (transactionRowButton) {
              transactionRowButton.classList.add('highlighted-row');
  
              const parentDiv = transactionRowButton.parentElement;
              if (parentDiv) {
                parentDiv.style.position = 'relative';
          
                const tooltip = document.createElement('div');
                tooltip.className = 'custom-tooltip';

                const link = document.createElement('a');
                link.href = "https://zkp2p.xyz";
                link.target = "_blank";
                link.rel = "noopener noreferrer";
                
                const icon = document.createElement('img');
                icon.src = chrome.runtime.getURL('icon-48.png');
                icon.alt = 'Icon';
                icon.className = 'custom-tooltip-icon';
                link.appendChild(icon);
                tooltip.appendChild(link);
          
                tooltip.style.position = 'absolute';
                tooltip.style.left = `${transactionRowButton.offsetWidth}px`;
                tooltip.style.top = '50%';
                tooltip.style.transform = 'translateY(-50%)';
          
                parentDiv.appendChild(tooltip);
              }        
            }
          }
        }
      }
    });
  });
}

(async () => {
  console.log('Content script works!');
  console.log('Must reload extension for modifications to take effect.');
})();
