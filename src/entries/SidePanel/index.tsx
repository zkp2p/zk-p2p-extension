import React from 'react';
import { createRoot } from 'react-dom/client';
import { HashRouter } from 'react-router-dom';
import { Provider } from 'react-redux';

import SidePanel from './SidePanel';
import { BackgroundActiontype } from '../Background/rpc';
import './index.scss';
import store from '../../utils/store';

const container = document.getElementById('app-container');
const root = createRoot(container!); // createRoot(container!) if you use TypeScript

chrome.runtime.onMessage.addListener((request) => {
  switch (request.type) {
    case BackgroundActiontype.push_action: {
      if (
        request.data.tabId === store.getState().requests.activeTab?.id ||
        request.data.tabId === 'background'
      ) {
        store.dispatch(request.action);
      }
      break;
    }
  }
});

root.render(
  <Provider store={store}>
    <HashRouter>
      <SidePanel />
    </HashRouter>
  </Provider>,
);
