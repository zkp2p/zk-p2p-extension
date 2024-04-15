import React, { useEffect, useMemo, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import styled from 'styled-components';
import deepEqual from 'fast-deep-equal';
import { AppRootState } from 'reducers';
import browser from 'webextension-polyfill';

import { notarizeRequest, setActiveTab, useActiveTabUrl, useRequests } from '../../reducers/requests';
import { useHistoryOrder } from '../../reducers/history';
import { BackgroundActiontype, RequestHistory, RequestLog } from '../../entries/Background/rpc';

import NotarizationTable from '@newcomponents/Notarizations/Table';
import RequestTable from '@newcomponents/Requests/Table';
import { InstructionTitle } from '@newcomponents/Instructions/Title';
import { Button } from '@newcomponents/common/Button';
import { OnRamperIntent, WiseAction, WiseActionType, WiseStep, WiseRequest, WISE_PLATFORM } from '@utils/types';
import { urlify } from '@utils/misc';

import bookmarks from '../../../utils/bookmark/bookmarks.json';

interface ActionSettings {
  action_url: string;
  navigate_title: string;
  navigate_instruction: string;
  request_title: string;
  request_instruction: string;
  review_title: string;
  review_instruction: string;
  bookmark_data: {
    secretResponseSelector: string[];
    metaDataSelector: string[];
  }
}


interface WiseProps {
  action: WiseActionType;
}

const Wise: React.FC<WiseProps> = ({
  action
}) => {
  const dispatch = useDispatch();
  const url = useActiveTabUrl();

  /*
   * Contexts
   */

  const requests = useRequests('descending'); // RequestLog
  const requestHistoryOrder = useHistoryOrder('descending'); // string[]
  const notarizations = useSelector((state: AppRootState) => {
    return requestHistoryOrder.map(id => state.history.map[id]);
  }, deepEqual);


  /*
   * State
   */

  const [originalTabId, setOriginalTabId] = useState<number | null>(null);
  const [onramperIntent, setOnramperIntent] = useState<OnRamperIntent | null>(null);
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);
  const [validNotarizationExists, setValidNotarizationExists] = useState<boolean>(false);

  const [loadedRequests, setLoadedRequests] = useState<RequestLog[]>([]);
  const [loadedNotarizations, setLoadedNotarizations] = useState<RequestHistory[]>([]);

  /*
   * Hooks
   */

  useEffect(() => {
    const requestsRetrieved = loadedRequests.length > 0;
    const indexNotSelected = selectedIndex === null;

    if (requestsRetrieved && indexNotSelected) {
      setSelectedIndex(0);
    }
  }, [requests, selectedIndex]);

  useEffect(() => {
    (async () => {
      if (onramperIntent) return;

      const onramperIntentData = await browser.runtime.sendMessage({
        type: BackgroundActiontype.get_onramper_intent,
        data: WISE_PLATFORM,
      });

      if (onramperIntentData) {
        setOnramperIntent(onramperIntentData);
      } else {
        setOnramperIntent(null);
      }
    })();
  }, [onramperIntent]);

  useEffect(() => {
    if (notarizations) {
      const filteredNotarizations = notarizations.filter(notarization => {
        switch (action) {
          case WiseAction.REGISTRATION:
            return notarization.requestType === WiseRequest.PAYMENT_PROFILE;

          case WiseAction.DEPOSITOR_REGISTRATION:
          case WiseAction.TRANSFER:
            return notarization.requestType === WiseRequest.TRANSFER_DETAILS;

          default:
            return false;
        }
      });

      const reverseOrderNotarizations = filteredNotarizations.reverse();
  
      setLoadedNotarizations(reverseOrderNotarizations);
    } else {
      setLoadedNotarizations([]);
    }
  }, [notarizations, action]);

  useEffect(() => {
    console.log('Updating loaded requests: ', requests);
  
    if (requests) {
      const filteredRequests = requests.filter(request => {
        const jsonResponseBody = JSON.parse(request.responseBody as string);

        switch (action) {
          case WiseAction.REGISTRATION:
            return request.requestType === WiseRequest.PAYMENT_PROFILE;

          case WiseAction.DEPOSITOR_REGISTRATION:
            if (!jsonResponseBody) return false;
            return (
              request.requestType === WiseRequest.TRANSFER_DETAILS &&
              jsonResponseBody.actor === "SENDER"
            );
          case WiseAction.TRANSFER:
            if (!jsonResponseBody) return false;
            if (request.requestType === WiseRequest.TRANSFER_DETAILS && jsonResponseBody.actor === "SENDER") {
              const jsonResponseBody = JSON.parse(request.responseBody as string);
              if (onramperIntent) {
                // If navigating from ZKP2P, then onramperIntent is populated. Therefore, we apply the filter
                return (
                  parseInt(jsonResponseBody.stateHistory[0].date) / 1000 >= parseInt(onramperIntent.intent.timestamp) && // Adjust Wise timestamp
                  parseInt(jsonResponseBody.targetAmount) >= parseInt(onramperIntent.fiatToSend)
                )
              }
              // If not navigating from ZKP2P, onramperIntent is empty. Therefore, we don't filter for users
              return true;
            }
            // Non-transfer requests are always filtered out
            return false;

          default:
            return false;
        }
      });
  
      setLoadedRequests(filteredRequests);
    } else {
      setLoadedRequests([]);
    }
  }, [requests, action]);

  useEffect(() => {
    const validNotarizationExists = loadedNotarizations.some(notarization => notarization.status === 'success');

    setValidNotarizationExists(validNotarizationExists);
  }, [loadedNotarizations]);

  /*
   * Handlers
   */

  const handleCreateTab = async() => {
    const [tab] = await browser.tabs.query({
      active: true,
      lastFocusedWindow: true,
    });

    if (tab) {
      setOriginalTabId(tab.id || null);
    }

    chrome.tabs.create({
      url: actionSettings.action_url
    }).then(newTab => {
      dispatch(setActiveTab(newTab))
    })
  };

  const handleReturnToTab = async () => {
    if (originalTabId) {
      chrome.tabs.update(originalTabId, { active: true }, (tab) => {
        if (chrome.runtime.lastError) {
          console.error("Failed to find original tab:", chrome.runtime.lastError.message);

          chrome.tabs.create({ url: urlForAction });
        }
      });
    } else {
      chrome.tabs.create({ url: urlForAction });
    }
  };

  const handleNotarizePressed = async() => {
    if (selectedIndex === null) {
      return;
    }

    console.log('Attempting to notarize', selectedIndex);

    const requestLog = requests[selectedIndex];
    const responseBody = requestLog.responseBody;
    const responseHeaders = requestLog.responseHeaders;
    if (!responseBody || !responseHeaders) return;

    const secretHeaders = requestLog.requestHeaders
      .map((headers) => {
        return `${headers.name.toLowerCase()}: ${headers.value || ''}` || '';
      })
      .filter((d) => !!d);

    const secretResps = [] as string[];

    actionSettings.bookmark_data.secretResponseSelector.forEach((secretResponseSelector) => {
      const regex = new RegExp(secretResponseSelector, 'g');

      // console.log(responseBody);
      const matches = responseBody.match(regex);
      // console.log('secretResponseSelector', secretResponseSelector);

      if (matches) {
        const hidden = matches[0];

        const selectionStart = responseBody.indexOf(hidden);
        const selectionEnd = selectionStart + hidden.length;

        if (selectionStart !== -1) {
          secretResps.push(responseBody.substring(selectionStart, selectionEnd));
        }
        // console.log('secretResps', secretResps);
      }
    });

    // Filter out any empty strings
    const filteredSecretResps = secretResps.filter((d) => !!d);

    const hostname = urlify(requestLog.url)?.hostname;
    const notaryUrl = 'http://0.0.0.0:7047'; // 'https://notary-california.zkp2p.xyz' // await get(NOTARY_API_LS_KEY);
    const websocketProxyUrl = 'ws://localhost:55688'; // 'wss://proxy-california.zkp2p.xyz' // await get(PROXY_API_LS_KEY);

    const headers: { [k: string]: string } = requestLog.requestHeaders.reduce(
      (acc: any, h) => {
        acc[h.name] = h.value;
        return acc;
      },
      { Host: hostname },
    );

    headers['Accept-Encoding'] = 'identity';
    headers['Connection'] = 'close';

    // console.log('res', response);
    // Extract metadata to display in Web application
    const metadataResp = [] as string[];
    
    // Add date of request if exists
    const requestDate = responseHeaders.find((h) => h.name === 'date' || h.name === 'Date');
    if (requestDate && requestDate.value) {
      metadataResp.push(requestDate.value);
    }

    actionSettings.bookmark_data.metaDataSelector.forEach((metaDataSelector) => {
      const regex = new RegExp(metaDataSelector, 'g');

      // console.log(requestLog.responseBody);
      const matches = responseBody.match(regex);
      // console.log('metaDataSelector', metaDataSelector);

      if (matches) {
        const revealed = matches[0];

        const selectionStart = responseBody.indexOf(revealed);
        const selectionEnd = selectionStart + revealed.length;

        if (selectionStart !== -1) {
          metadataResp.push(responseBody.substring(selectionStart, selectionEnd));
        }
        // console.log('metadataResp', metadataResp);
      }
    });

    const notarizeRequestParams = {
      url: requestLog.url,
      method: requestLog.method,
      headers: headers,
      body: requestLog.requestBody,
      // maxTranscriptSize: 16384,
      maxSentData: 4000,
      maxRecvData: 4000,
      notaryUrl,
      websocketProxyUrl,
      secretHeaders,
      secretResps: filteredSecretResps,
      metadata: metadataResp,
      originalTabId: originalTabId,
      requestType: requestLog.requestType,
    };


    dispatch(
      notarizeRequest(notarizeRequestParams),
    );
  };

  /*
   * Helpers
   */

  const urlForAction = useMemo(() => {
    switch (action) {
      case WiseAction.REGISTRATION:
        return 'https://zkp2p.xyz/register';
      
        case WiseAction.DEPOSITOR_REGISTRATION:
        return 'https://zkp2p.xyz/deposits';
      
        case WiseAction.TRANSFER:
        return 'https://zkp2p.xyz/swap';
      
        default:
        return 'https://zkp2p.xyz';
    }
  }, [action]);

  const actionSettings = useMemo(() => {
    const settingsObject = {
      navigate_title: 'Navigate to Wise',
      review_title: 'Use Proofs',
    } as ActionSettings;

    switch (action) {
      case WiseAction.REGISTRATION:
        settingsObject.request_title = 'Prove Wisetag';
        settingsObject.action_url = 'https://wise.com/account/payments';
        settingsObject.navigate_instruction = 'Go to the Payments page on Wise to load your account\'s Wisetag';
        settingsObject.request_instruction = 'Notarize the Wisetag, this will take approximately 20 seconds';
        settingsObject.review_instruction = 'Successful notarizations can now be used in zkp2p.xyz to register';

        const registrationBookmark = bookmarks[0];
        settingsObject.bookmark_data = {
          secretResponseSelector: registrationBookmark.secretResponseSelector,
          metaDataSelector: registrationBookmark.metaDataSelector,
        };
        break;


      case WiseAction.DEPOSITOR_REGISTRATION:
        settingsObject.request_title = 'Prove Past Payment';
        settingsObject.action_url = 'https://wise.com/all-transactions?direction=OUTGOING';
        settingsObject.navigate_instruction = 'Go to the Transactions page on Wise and open a past outgoing transaction'
        settingsObject.request_instruction = 'Notarize the transaction, this will take approximately 20 seconds'
        settingsObject.review_instruction = 'Successful notarizations can now be used in zkp2p.xyz to register'

        const depositorRegistrationBookmark = bookmarks[1];
        settingsObject.bookmark_data = {
          secretResponseSelector: depositorRegistrationBookmark.secretResponseSelector,
          metaDataSelector: depositorRegistrationBookmark.metaDataSelector,
        };
        break;

      case WiseAction.TRANSFER:
        settingsObject.request_title = 'Prove Payment Sent';
        settingsObject.action_url = 'https://wise.com/all-transactions?direction=OUTGOING';
        settingsObject.navigate_instruction = 'Go to the Transaction details page on Wise to view the send payment'
        settingsObject.request_instruction = 'Notarize the transaction, this will take approximately 20 seconds'
        settingsObject.review_instruction = 'Successful notarizations can now be used in zkp2p.xyz to on-ramp'

        const transferBookmark = bookmarks[2];
        settingsObject.bookmark_data = {
          secretResponseSelector: transferBookmark.secretResponseSelector,
          metaDataSelector: transferBookmark.metaDataSelector,
        };
        break;
    }

    return settingsObject;
  }, [action]);

  /*
   * Component
   */

  return (
    <Container>
      <BodyContainer>
        <BodyStepContainer>
          <InstructionTitle
            title={actionSettings.navigate_title}
            description={actionSettings.navigate_instruction}
            step={WiseStep.NAVIGATE}
          />

          <ButtonContainer>
            <Button
              onClick={() => handleCreateTab()}
              width={164}
              height={40}
              fontSize={14}
            >
              Go to Wise.com
            </Button>
          </ButtonContainer>
        </BodyStepContainer>

        <BodyStepContainer>
          <InstructionTitle
            title={actionSettings.request_title}
            description={actionSettings.request_instruction}
            step={WiseStep.PROVE}
          />

          <RequestTableAndButtonContainer>
            <RequestTable
              action={action}
              requests={loadedRequests}
              setSelectedIndex={setSelectedIndex}
              selectedIndex={selectedIndex}
            />

            <ButtonContainer>
              <Button
                disabled={selectedIndex === null}
                onClick={() => handleNotarizePressed()}
                width={164}
                height={40}
                fontSize={14}
              >
                Notarize
              </Button>
            </ButtonContainer>
          </RequestTableAndButtonContainer>
        </BodyStepContainer>

        <BodyStepContainer>
          <InstructionTitle
            title={actionSettings.review_title}
            description={actionSettings.review_instruction}
            step={WiseStep.REVIEW}
          />

          <NotarizationTable
            action={action}
            notarizations={loadedNotarizations}
          />

          <ButtonContainer>
            <Button
              onClick={() => handleReturnToTab()}
              disabled={!validNotarizationExists}
              width={164}
              height={40}
              fontSize={14}
            >
              Go to zkp2p.xyz
            </Button>
          </ButtonContainer>
        </BodyStepContainer>
      </BodyContainer>
    </Container>
  );
}

const Container = styled.div`
  width: 100%;
  justify-content: center;
  border-radius: 16px;
  padding: 0rem 1.5rem;
`;

const BodyContainer = styled.div`
  display: flex;
  flex-direction: column;
  border-radius: 16px;
  gap: 1.5rem;
`;

const BodyStepContainer = styled.div`
  display: flex;
  flex-direction: column;
  justify-content: flex-start;
  gap: 0.75rem;
`;

const RequestTableAndButtonContainer = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
`;

const ButtonContainer = styled.div`
  margin: auto;
`;

export default Wise;
