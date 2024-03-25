import { fetchRequestHistory } from './history';


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

    const requestHistory = fetchRequestHistory();

    // window.postMessage(
    //   { type: 'REQUEST_HISTORY_RESPONSE', text: 'Hello from the extension!' },
    //   '*',
    // );

    // console.log('Content posted REQUEST_HISTORY_RESPONSE');
  }
});

(async () => {
  console.log('Content script works!');
  console.log('Must reload extension for modifications to take effect.');
})();
