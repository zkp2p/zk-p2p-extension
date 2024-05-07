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
    highlightTransactionByAmountAndTimestamp(message.data.fiatToSend, message.data.intent.timestamp);
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

function highlightTransactionByAmountAndTimestamp(amountText: string, timestamp: string) {
  waitForElements(transactionRowsSelector, (transactionBlock: NodeListOf<Element>) => {
    const transactionRows = transactionBlock[0].querySelectorAll('div');
    transactionRows.forEach((transactionRow) => {
      const spanForTransactionAmount = transactionRow.querySelector('div + span + span > span > div > span');
      const spanForTransactionTimestamp = transactionRow.querySelector('div + span > span + span > span > div');
      
      if (spanForTransactionAmount && spanForTransactionTimestamp) {
        const spanTextContent = spanForTransactionAmount.textContent;
        const spanTimestampTextContent = spanForTransactionTimestamp.textContent;

        if (spanTextContent && spanTimestampTextContent) {
          const spanTextContentSubstring = spanTextContent.replace(/[^\d.]/g, '');
          const paymentTimestamp = regexMatchTimestamp(spanTimestampTextContent);
          
          if (parseFloat(spanTextContentSubstring) >= parseFloat(amountText) && paymentTimestamp >= parseInt(timestamp)) {
            // console.log('textMatches:', spanTextContent);
  
            const transactionRowButton = transactionRow.querySelector('button') as HTMLElement;
            if (transactionRowButton) {
              transactionRowButton.classList.add('highlighted-row');
  
              const parentDiv = transactionRowButton.parentElement;
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

function getUnixTimestampForToday(timeStr: string) { 
  const now = new Date();
  const [time, period] = timeStr.split(' ');
  const [hours, minutes] = time.split(':');

  // Convert hour to 24-hour format based on AM/PM
  const hoursNumber = period.toLowerCase() === 'pm' ? (parseInt(hours) % 12) + 12 : parseInt(hours) % 12;

  // Set hours and minutes to 'now' Date object
  now.setHours(hoursNumber);
  now.setMinutes(parseInt(minutes));
  now.setSeconds(0); // Reset seconds to 0 for consistency

  // Return Unix timestamp in seconds
  return Math.floor(now.getTime() / 1000);
}

function regexMatchTimestamp(inputString: string) {
  const timestampRecentRegex = /Moments ago/i;
  const timestampOlderRegex = /(\d+\sminute(s)? ago)/i;
  const timestampOldestRegex = /(\d{1,2}:\d{2}\s?(AM|PM))/i;
  const matchRecent = inputString.match(timestampRecentRegex);
  const matchOlder = inputString.match(timestampOlderRegex);
  const matchOldest = inputString.match(timestampOldestRegex);

  let timestamp = 0;
  if (matchOldest) {
    timestamp = getUnixTimestampForToday(matchOldest[0]);
  } else if (matchOlder) {
    timestamp = Date.now();
  } else if (matchRecent) {
    timestamp = Date.now();
  }
  return timestamp;
}


(async () => {
  console.log('Content script works!');
  console.log('Must reload extension for modifications to take effect.');
})();
