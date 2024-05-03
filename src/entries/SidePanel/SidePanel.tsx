import React, { useEffect } from 'react';
import { Navigate, Route, Routes, useNavigate } from 'react-router';
import { useDispatch, useSelector } from 'react-redux';
import browser from 'webextension-polyfill';
import styled from 'styled-components';

import { setActiveTab, setRequests } from '../../reducers/requests';
import { fetchApiUrls, measureLatency, setApiUrls, useBestLatency } from '../../reducers/settings';
import { API_CONFIGURATIONS } from '@utils/types';
import { BackgroundActiontype } from '../Background/rpc';
import Home from '../../pages/Home';

import Revolut from '../../pages/Revolut';
import NotarySettings from '../../pages/NotarySettings';
import { RevolutAction } from '@utils/types';
import { AppRootState } from 'reducers';

import { TopNav } from '@newcomponents/TopNav/TopNav';
import { colors } from '@theme/colors';


const SidePanel = () => {
  const dispatch = useDispatch<any>();
  const navigate = useNavigate();
  const bestLatency = useBestLatency();
  const { autoSelect } = useSelector((state: AppRootState) => state.settings);

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

      dispatch(fetchApiUrls());

      dispatch(measureLatency(API_CONFIGURATIONS.map(config => config.notary)));
    })();
  }, []);

  useEffect(() => {
    if (bestLatency && autoSelect === "autoselect") {
      const apiConfiguration = API_CONFIGURATIONS.find((config) => config.notary === bestLatency.url);
      if (apiConfiguration) {
        dispatch(setApiUrls({ notary: bestLatency.url, proxy: apiConfiguration.proxy, autoSelect: autoSelect }));
      }
    }
  }, [bestLatency, autoSelect]);

  useEffect(() => {
    // Adding listener for cues to navigate to a different page
    const handleMessages = (message: any) => {
      if (message.action === 'navigate') {
        if (!message.route) {
          return;
        }

        navigate(message.route);
      }
    };
    chrome.runtime.onMessage.addListener(handleMessages);

    // Send message to background that panel is ready to navigate
    chrome.runtime.sendMessage({ action: 'panel_ready_to_navigate' });

    return () => {
      chrome.runtime.onMessage.removeListener(handleMessages);
    };
  }, []);

  return (
    <AppContainer>
      <TopNav />
      <Routes>
        <Route path="/home" element={<Home />} />
        <Route path="/registration" element={<Revolut action={RevolutAction.REGISTRATION}/>} />
        <Route path="/onramp" element={<Revolut action={RevolutAction.TRANSFER}/>} />
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
