export const fetchRequestHistory = () => {
  chrome.runtime.sendMessage({ action: 'REQUEST_HISTORY_BACKGROUND' }, (response) => {
    console.log('Content received REQUEST_HISTORY_BACKGROUND', response);

    window.postMessage(
      {
        type: 'REQUEST_HISTORY_RESPONSE',
        status: 'loaded',
        requestHistory: response,
      },
      '*',
    );
  });

  console.log('Content posted REQUEST_HISTORY_BACKGROUND');
};
