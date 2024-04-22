import React, { useEffect } from 'react';
import { Navigate, Route, Routes, useNavigate } from 'react-router';
import { useDispatch } from 'react-redux';
import browser from 'webextension-polyfill';
import styled from 'styled-components';

import { setActiveTab, setRequests, useActiveTab, useActiveTabUrl } from '../../reducers/requests';
import { measureLatency, useBestLatency } from '../../reducers/settings';
import { API_CONFIGURATIONS } from '@utils/types';
import { BackgroundActiontype } from '../Background/rpc';
import Requests from '../../pages/Requests';
import Options from '../../pages/Options';
import Request from '../../pages/Requests/Request';
import Home from '../../pages/Home';
import RequestBuilder from '../../pages/RequestBuilder';
import Notarize from '../../pages/Notarize';
import ProofViewer from '../../pages/ProofViewer';
import History from '../../pages/History';
import ProofUploader from '../../pages/ProofUploader';

import Wise from '../../pages/Wise';
import NotarySettings from '../../pages/NotarySettings';
import { WiseAction } from '@utils/types';


import logo from '../../assets/img/icon-48.png';
import { TopNav } from '@newcomponents/TopNav/TopNav';
import { colors } from '@theme/colors';


const SidePanel = () => {
  const dispatch = useDispatch<any>();
  const activeTab = useActiveTab();
  const url = useActiveTabUrl();
  const navigate = useNavigate();
  const bestLatency = useBestLatency();

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

      dispatch(measureLatency(API_CONFIGURATIONS.map(config => `${config.notary}/info`)));
    })();
  }, []);

  useEffect(() => {
    if (bestLatency) {
      console.log('bestLatency', bestLatency);

      
    }
  }, [bestLatency]);

  return (
    <AppContainer>
      {/* <div className="flex flex-nowrap flex-shrink-0 flex-row items-center relative gap-2 h-9 p-2 cursor-default justify-center bg-slate-300 w-full">
        <img
          className="absolute left-2 h-5 cursor-pointer"
          src={logo}
          alt="logo"
          onClick={() => navigate('/')}
        />
        <div className="absolute right-2 flex flex-nowrap flex-row items-center gap-1 justify-center w-fit">
          {!!activeTab?.favIconUrl && (
            <img src={activeTab?.favIconUrl} className="h-5 rounded-full" alt="logo" />
          )}
          <div className="text-xs">{url?.hostname}</div>
        </div>
      </div> */}
      <TopNav />
      <Routes>
        <Route path="/requests/:requestId/*" element={<Request />} />
        <Route path="/notary/:requestId" element={<Notarize />} />
        <Route path="/verify/:requestId/*" element={<ProofViewer />} />
        <Route path="/verify" element={<ProofUploader />} />
        <Route path="/history" element={<History />} />
        <Route path="/requests" element={<Requests />} />
        <Route path="/custom/*" element={<RequestBuilder />} />
        <Route path="/options" element={<Options />} />
        <Route path="/home" element={<Home />} />
        <Route path="/registration" element={<Wise action={WiseAction.REGISTRATION}/>} />
        <Route path="/deposit" element={<Wise action={WiseAction.DEPOSITOR_REGISTRATION}/>} />
        <Route path="/onramp" element={<Wise action={WiseAction.TRANSFER}/>} />
        <Route path="/settings" element={<NotarySettings/>} />
        <Route path="*" element={<Navigate to="/home" />} />
      </Routes>
    </AppContainer>
  );
};

const AppContainer = styled.div`
  display: flex;
  flex-direction: column;
  width: 100%;
  height: 100%;
  overflow: hidden;
  background-color: ${colors.appBackground};
`;

export default SidePanel;
