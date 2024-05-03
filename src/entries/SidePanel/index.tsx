import React from 'react';
import { createRoot } from 'react-dom/client';
import { HashRouter } from 'react-router-dom';
import { Provider } from 'react-redux';
import browser from 'webextension-polyfill';

import SidePanel from './SidePanel';
import { setActiveTab } from '../../reducers/requests';
import { BackgroundActiontype } from '../Background/rpc';
import './index.scss';
import store from '../../utils/store';

const container = document.getElementById('app-container');
const root = createRoot(container!); // createRoot(container!) if you use TypeScript

chrome.runtime.onMessage.addListener((request) => {
  if (request.type === BackgroundActiontype.push_action) {
    store.dispatch(request.action);
  }
});

function updateActiveTab() {
  browser.tabs.query({
    active: true,
    currentWindow: true
  }).then(tabs => {
    const activeTab = tabs[0];

    store.dispatch(setActiveTab(activeTab || null));
  }).catch(err => console.error('Failed to fetch active tab', err));
};

chrome.tabs.onActivated.addListener(updateActiveTab);
chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
  if (changeInfo.url) {
    updateActiveTab();
  }
});

root.render(
  <Provider store={store}>
    <HashRouter>
      <SidePanel />
    </HashRouter>
  </Provider>,
);
