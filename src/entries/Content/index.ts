window.onerror = (error) => {
  // console.log('error');
  // console.log(error);
};

window.addEventListener('message', function (event) {
  if (event.source != window) {
    return;
  }

  if (event.data.type && event.data.type == 'FETCH_REQUEST_HISTORY') {
    console.log('Content received FETCH_REQUEST_HISTORY');

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
  }
});

(async () => {
  console.log('Content script works!');
  console.log('Must reload extension for modifications to take effect.');
})();
