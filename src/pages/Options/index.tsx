import React, { ReactElement, useState, useEffect, useCallback } from 'react';

import { set, get, NOTARY_API_LS_KEY, PROXY_API_LS_KEY } from '../../utils/storage';

const API_CONFIGURATIONS = [
  {
    name: 'Local',
    notary: 'http://0.0.0.0:7047',
    proxy: 'ws://localhost:55688',
  },
  {
    name: 'Mumbai',
    notary: 'https://notary-mumbai.zkp2p.xyz',
    proxy: 'wss://proxy-mumbai.zkp2p.xyz',
  },
  {
    name: 'Singapore',
    notary: 'https://notary-singapore.zkp2p.xyz',
    proxy: 'wss://proxy-singapore.zkp2p.xyz',
  },
  {
    name: 'Ohio',
    notary: 'https://notary-ohio.zkp2p.xyz',
    proxy: 'wss://proxy-ohio.zkp2p.xyz',
  },
  {
    name: 'California',
    notary: 'https://notary-california.zkp2p.xyz',
    proxy: 'wss://proxy-california.zkp2p.xyz',
  },
];

export default function Options(): ReactElement {
  const [notary, setNotary] = useState('https://notary-california.zkp2p.xyz');
  const [proxy, setProxy] = useState('wss://proxy-california.zkp2p.xyz');
  const [dirty, setDirty] = useState(false);

  useEffect(() => {
    (async () => {
      const storedNotaryUrl = await get(NOTARY_API_LS_KEY);
      const storedProxyUrl = await get(PROXY_API_LS_KEY);

      if (storedNotaryUrl && storedProxyUrl) {
        setNotary(storedNotaryUrl);
        setProxy(storedProxyUrl);
      };
    })();
  }, []);

  const onSave = useCallback(async () => {
    await set(NOTARY_API_LS_KEY, notary);
    await set(PROXY_API_LS_KEY, proxy);
    
    setDirty(false);
  }, [notary, proxy]);

  const handleApiChange = useCallback((newNotary: string, newProxy: string) => {
    setNotary(newNotary);
    setProxy(newProxy);
    setDirty(true);
  }, []);

  return (
    <div className="flex flex-col flex-nowrap flex-grow">
      <div className="flex flex-row flex-nowrap py-1 px-2 gap-2 font-bold text-base">Settings</div>

      <div className="flex flex-col flex-nowrap py-1 px-2 gap-2">
        <div className="font-semibold">Notary API</div>
        <input
          type="text"
          className="input border"
          placeholder="http://localhost:7047"
          onChange={(e) => {
            setNotary(e.target.value);
            setDirty(true);
          }}
          value={notary}
        />
      </div>

      <div className="flex flex-col flex-nowrap py-1 px-2 gap-2">
        <div className="font-semibold">Proxy API</div>
        <input
          type="text"
          className="input border"
          placeholder="ws://127.0.0.1:55688"
          onChange={(e) => {
            setProxy(e.target.value);
            setDirty(true);
          }}
          value={proxy}
        />
      </div>

      <div className="flex flex-row flex-nowrap justify-end gap-2 p-2">
        <button
          className="button !bg-primary/[0.9] hover:bg-primary/[0.8] active:bg-primary !text-white"
          disabled={!dirty}
          onClick={onSave}
        >
          Save
        </button>
      </div>

      <div className="flex flex-col gap-2 w-full p-2">
        {API_CONFIGURATIONS.map((config) => (
          <button
            key={config.name}
            className="button w-full !bg-primary/[0.9] hover:bg-primary/[0.8] active:bg-primary !text-white"
            onClick={() => handleApiChange(config.notary, config.proxy)}
          >
            {`${config.name} Proxy`}
          </button>
        ))}
      </div>
    </div>
  );
}
