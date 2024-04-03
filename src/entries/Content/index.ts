window.onerror = (error) => {
  // console.log('error');
  // console.log(error);
};

window.addEventListener('message', function (event) {
  if (event.source != window) {
    return;
  }

  if (event.data.type && event.data.type == 'fetch_extension_version') {
    // console.log('Content received fetch_extension_version');

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
    // console.log('Content received fetch_profile_request_history');

    chrome.runtime.sendMessage({ action: 'REQUEST_HISTORY_BACKGROUND' }, (response) => {
      // console.log('Content received fetch_profile_request_history', response);

      let filteredResponse = [];
      if (response.notaryRequests.length > 0) {
        filteredResponse = response.notaryRequests.filter(
          (item: { status: string; url: string }) =>
            item.status === 'success' && item.url === 'https://wise.com/gateway/v1/payments',
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
    });
  }

  if (event.data.type && event.data.type == 'fetch_transfer_request_history') {
    // console.log('Content received fetch_transfer_request_history');

    chrome.runtime.sendMessage({ action: 'REQUEST_HISTORY_BACKGROUND' }, (response) => {
      console.log('Content received fetch_transfer_request_history', response);

      let filteredResponse = [];
      if (response.notaryRequests.length > 0) {
        const transferRequestPattern =
          /^https:\/\/wise\.com\/gateway\/v3\/profiles\/\d+\/transfers\/\d+$/;
        filteredResponse = response.notaryRequests.filter(
          (item: { status: string; url: string }) =>
            item.status === 'success' && transferRequestPattern.test(item.url),
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
    });
  }
});

(async () => {
  console.log('Content script works!');
  console.log('Must reload extension for modifications to take effect.');
})();
