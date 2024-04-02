import React from 'react';
import { createRoot } from 'react-dom/client';
import { HashRouter } from 'react-router-dom';
import { Provider } from 'react-redux';
import { PrivyProvider } from '@privy-io/react-auth';
import { sepolia } from 'wagmi/chains'
import { ZeroDevPrivyWagmiProvider } from '@zerodev/wagmi/privy';
import {
  WagmiConfig,
  createConfig,
  configureChains,
} from "wagmi";
import { alchemyProvider } from 'wagmi/providers/alchemy'
import { publicProvider } from "wagmi/providers/public";

import SidePanel from './SidePanel';
import { BackgroundActiontype } from '../Background/rpc';
import './index.scss';
import store from '../../utils/store';

const container = document.getElementById('app-container');
const root = createRoot(container!); // createRoot(container!) if you use TypeScript

const configureChainsConfig = configureChains(
  [sepolia],
  [
    alchemyProvider({ apiKey: process.env.ALCHEMY_API_KEY || '' }),
    publicProvider()
  ]
);

const zeroDevOptions = {
  projectIds: [process.env.ZERODEV_APP_ID || ''],
  projectId: process.env.ZERODEV_APP_ID || '',
  useSmartWalletForExternalEOA: false, // Only sponsor gas for embedded wallets
}

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

console.log('process.env.ALCHEMY_API_KEY', process.env.ALCHEMY_API_KEY);
console.log('process.env.PRIVY_APP_ID', process.env.PRIVY_APP_ID);
console.log('process.env.ZERODEV_APP_ID', process.env.ZERODEV_APP_ID);

root.render(
    <PrivyProvider
      appId={process.env.PRIVY_APP_ID || ''}
      config={{
        embeddedWallets: {
          createOnLogin: 'users-without-wallets',
          noPromptOnSignature: true
        },
        appearance: {
          theme: "#0E111C",
          accentColor: "#df2e2d",
        },
        defaultChain: sepolia,
        supportedChains: [sepolia]
      }}
    >
      <ZeroDevPrivyWagmiProvider wagmiChainsConfig={configureChainsConfig} options={zeroDevOptions}>
        <Provider store={store}>
          <HashRouter>
            <SidePanel />
          </HashRouter>
        </Provider>,
      </ZeroDevPrivyWagmiProvider>
    </PrivyProvider>
);
