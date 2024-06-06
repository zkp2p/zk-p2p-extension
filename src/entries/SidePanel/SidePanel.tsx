import React, { useEffect, useState } from 'react';
import { Navigate, Route, Routes, useNavigate } from 'react-router';
import { useDispatch, useSelector } from 'react-redux';
import browser from 'webextension-polyfill';
import styled from 'styled-components';

import { setActiveTab, setRequests } from '../../reducers/requests';
import { fetchApiUrls, measureLatency, setApiUrls, useBestLatency } from '../../reducers/settings';
import { DEFAULT_API_CONFIGURATIONS } from '@utils/types';
import { BackgroundActiontype } from '../Background/rpc';
import Home from '../../pages/Home';

import Revolut from '../../pages/Revolut';
import NotarySettings from '../../pages/NotarySettings';
import { RevolutAction } from '@utils/types';
import { AppRootState } from 'reducers';

import { TopNav } from '@components/TopNav/TopNav';
import { colors } from '@theme/colors';
import useGithubClient, { NotaryConfiguration } from '@hooks/useFetchNotaryList';


const SidePanel = () => {
  /*
   * Context
   */

  const dispatch = useDispatch<any>();
  const navigate = useNavigate();
  const bestLatency = useBestLatency();
  const { autoSelect } = useSelector((state: AppRootState) => state.settings);
  const { fetchData } = useGithubClient();

  /*
   * State
   */

  const [notaryList, setNotaryList] = useState<NotaryConfiguration[] | null>(null);

  /*
   * Hooks
   */

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

      const fetchedNotaryList = await fetchData();
      if (fetchedNotaryList) {
        setNotaryList(fetchedNotaryList.notaryList);
      } else {
        setNotaryList(DEFAULT_API_CONFIGURATIONS);
      }
    })();
  }, []);

  useEffect(() => {
    if (notaryList) {
      dispatch(
        measureLatency(notaryList.map(config => config.notary))
      );
    }
  }, [notaryList]);

  useEffect(() => {
    if (notaryList) {
      if (bestLatency && autoSelect === "autoselect") {
        const apiConfiguration = notaryList.find((config) => config.notary === bestLatency.url);
  
        if (apiConfiguration) {
          dispatch(
            setApiUrls(
              { notary: bestLatency.url, proxy: apiConfiguration.proxy, autoSelect: autoSelect }
            )
          );
        }
      } else {
        console.log('Manual notary previously selected');
      }
    } else {
      console.log('No notary list to choose from yet');
    }
  }, [notaryList, bestLatency, autoSelect]);

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

  /*
   * Component
   */

  return (
    <AppContainer>
      <TopNav notaryList={notaryList}/>
      <Routes>
        <Route path="/home" element={<Home />} />
        <Route path="/registration" element={<Revolut action={RevolutAction.REGISTRATION}/>} />
        <Route path="/onramp" element={<Revolut action={RevolutAction.TRANSFER}/>} />
        <Route path="/settings" element={<NotarySettings notaryList={notaryList}/>} />
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
