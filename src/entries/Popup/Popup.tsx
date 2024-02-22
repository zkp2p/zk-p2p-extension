import React, { useEffect } from 'react';
import { Navigate, Route, Routes, useNavigate } from 'react-router';
import { useDispatch } from 'react-redux';
import {
  setActiveTab,
  setRequests,
  useActiveTab,
  useActiveTabUrl,
} from '../../reducers/requests';
import logo from '../../assets/img/logo192.png';
import { BackgroundActiontype } from '../Background/rpc';
import browser from 'webextension-polyfill';

const Popup = () => {
  const dispatch = useDispatch();
  const activeTab = useActiveTab();
  const url = useActiveTabUrl();
  const navigate = useNavigate();

  useEffect(() => {
    (async () => {
      const [tab] = await browser.tabs.query({
        active: true,
        lastFocusedWindow: true,
      });

      dispatch(setActiveTab(tab || null));

      const logs = await browser.runtime.sendMessage({
        type: BackgroundActiontype.get_requests,
        data: tab?.id,
      });

      dispatch(setRequests(logs));

      await browser.runtime.sendMessage({
        type: BackgroundActiontype.get_prove_requests,
        data: tab?.id,
      });
    })();
  }, []);

  return (
    <div className="flex flex-col w-full h-full overflow-hidden">
      <div className="flex flex-nowrap flex-shrink-0 flex-row items-center relative gap-2 h-9 p-2 cursor-default justify-center bg-slate-300 w-full">
        <img
          className="absolute left-2 h-5 cursor-pointer"
          src={logo}
          alt="logo"
          onClick={() => navigate('/')}
        />
        <div className="absolute right-2 flex flex-nowrap flex-row items-center gap-1 justify-center w-fit">
          {!!activeTab?.favIconUrl && (
            <img
              src={activeTab?.favIconUrl}
              className="h-5 rounded-full"
              alt="logo"
            />
          )}
          <div className="text-xs">{url?.hostname}</div>
        </div>
      </div>
      <Routes>
        <Route path="*" element={<Navigate to="/home" />} />
      </Routes>
    </div>
  );
};

export default Popup;
