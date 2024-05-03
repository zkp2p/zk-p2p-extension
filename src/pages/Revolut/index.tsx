import { parse as parseCookie } from 'cookie';
import React, { useEffect, useMemo, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import styled from 'styled-components';
import deepEqual from 'fast-deep-equal';
import { AppRootState } from 'reducers';
import browser from 'webextension-polyfill';

import { BackgroundActiontype, RequestHistory, RequestLog } from '@entries/Background/rpc';
import { Button } from '@newcomponents/common/Button';
import { InstructionTitle } from '@newcomponents/Instructions/Title';
import NotarizationTable from '@newcomponents/Notarizations/Revolut/Table';
import RequestTable from '@newcomponents/Requests/Revolut/Table';
import { notarizeRequest, setActiveTab, useActiveTabUrl, useRequests } from '@reducers/requests';
import { useHistoryOrder } from '@reducers/history';
import { urlify } from '@utils/misc';
import { OnRamperIntent, RevolutAction, RevolutActionType, RevolutStep, RevolutRequest, REVOLUT_PLATFORM } from '@utils/types';
import bookmarks from '../../../utils/bookmark/revolut.json';

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
    skipRequestHeaders: string[];
    includeRequestCookies: string[];
    maxSentData: Number,
    maxRecvData: Number
  }
}


interface RevolutProps {
  action: RevolutActionType;
}

const Revolut: React.FC<RevolutProps> = ({
  action
}) => {
  const dispatch = useDispatch();
  const url = useActiveTabUrl();

  /*
   * Contexts
   */

  const requestsFromStorage = useRequests('descending'); // RequestLog
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

  const [filteredRequests, setFilteredRequests] = useState<RequestLog[]>([]);
  const [loadedNotarizations, setLoadedNotarizations] = useState<RequestHistory[]>([]);

  /*
   * Hooks
   */

  useEffect(() => {
    const requestsRetrieved = filteredRequests.length > 0;
    const indexNotSelected = selectedIndex === null;

    console.log('Requests retrieved:', requestsRetrieved);
    console.log('Index not selected:', indexNotSelected);

    if (requestsRetrieved && indexNotSelected) {
      setSelectedIndex(0);
    }
  }, [filteredRequests, selectedIndex]);

  useEffect(() => {
    (async () => {
      if (onramperIntent) return;

      const onramperIntentData = await browser.runtime.sendMessage({
        type: BackgroundActiontype.get_onramper_intent,
        data: REVOLUT_PLATFORM,
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
          case RevolutAction.REGISTRATION:
            return notarization.requestType === RevolutRequest.PAYMENT_PROFILE;

          case RevolutAction.TRANSFER:
            return notarization.requestType === RevolutRequest.TRANSFER_DETAILS;

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
    console.log('Updating loaded requests: ', requestsFromStorage);
  
    if (requestsFromStorage) {
      const filteredRequests = requestsFromStorage.filter(request => {
        switch (action) {
          case RevolutAction.REGISTRATION:
            const jsonResponseBody = JSON.parse(request.responseBody as string);
            return (
              request.requestType === RevolutRequest.PAYMENT_PROFILE &&
              !jsonResponseBody.code
            );

          case RevolutAction.TRANSFER:
            try {
              const jsonResponseBody = JSON.parse(request.responseBody as string);
              const amountParsed = jsonResponseBody[0].amount / 100 * -1;
              if (
                request.requestType === RevolutRequest.TRANSFER_DETAILS &&
                amountParsed > 0 && // Filter receive funds
                !jsonResponseBody[0].beneficiary // Filter bank withdrawals
              ) {
                if (onramperIntent) {
                  // If navigating from ZKP2P, then onramperIntent is populated. Therefore, we apply the filter
                  return (
                    parseInt(jsonResponseBody[0].completedDate) / 1000 >= parseInt(onramperIntent.intent.timestamp) && // Adjust Revolut timestamp
                    amountParsed >= parseInt(onramperIntent.fiatToSend) // TODO: we can filter revtag matches too if client sends this
                  )
                }
                // If not navigating from ZKP2P, onramperIntent is empty. Therefore, we don't filter for users
                return true;
              }
              return false;
            } catch (e) {
              console.error('Error parsing response body:', e);
              return false;
            }

          default:
            return false;
        }
      });

      setFilteredRequests(filteredRequests);
    } else {
      setFilteredRequests([]);
    }
  }, [requestsFromStorage, action]);

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

    browser.tabs.create({
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

    // Replay request because we need to remove values from the response
    const requestLog = filteredRequests[selectedIndex];
    const responseBody = requestLog.responseBody;
    const responseHeaders = requestLog.responseHeaders;
    if (!responseBody || !responseHeaders) return;

    // Add "ALL" headers to secretHeaders, So all of them will be redacted
    const secretHeaders = requestLog.requestHeaders
      .map((headers) => {
        return `${headers.name.toLowerCase()}: ${headers.value || ''}` || '';
      })
      .filter((d) => !!d);

    const secretResps = [] as string[];

    // console.log('secretHeaders', secretHeaders);

    // Add certain fields in the response to secretResps to redact them
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

    // Skip the headers to make the request in MPC-TLS lighter
    const headers: { [k: string]: string } = requestLog.requestHeaders.reduce(
      (acc: any, h) => {
        if (!actionSettings.bookmark_data.skipRequestHeaders.includes(h.name)) {
          acc[h.name] = h.value;
        }
        return acc;
      },
      { Host: hostname },
    );

    // Include only the cookies that are specified in config
    let cookies = parseCookie(headers['Cookie']);
    const filteredCookies = actionSettings.bookmark_data.includeRequestCookies.map(cookie => {
      return `${cookie}=${cookies[cookie]}`;
    }).join(`; `);
    headers['Cookie'] = filteredCookies;
    headers['Accept-Encoding'] = 'identity';
    headers['Connection'] = 'close';

    // Add filtered cookies to secretHeaders
    secretHeaders.push(`cookie: ${headers['Cookie'] || ''}`);

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

    // console.log('Headers being sent for notarization', headers)
    // console.log('maxRecvData', maxRecvData)

    
    const notarizeRequestParams = {
      url: requestLog.url,
      method: requestLog.method,
      headers: headers,
      body: requestLog.requestBody,
      maxSentData: actionSettings.bookmark_data.maxSentData,
      maxRecvData: actionSettings.bookmark_data.maxRecvData,
      notaryUrl,
      websocketProxyUrl,
      secretHeaders,
      secretResps: filteredSecretResps,
      metadata: metadataResp,
      originalTabId: originalTabId,
      requestType: requestLog.requestType,
    } as RequestHistory;


    dispatch(
      notarizeRequest(notarizeRequestParams) as any,
    );
  };

  /*
   * Helpers
   */

  const urlForAction = useMemo(() => {
    switch (action) {
      case RevolutAction.REGISTRATION:
        return 'https://zkp2p.xyz/register';
      
        case RevolutAction.TRANSFER:
        return 'https://zkp2p.xyz/swap';
      
        default:
        return 'https://zkp2p.xyz';
    }
  }, [action]);

  const actionSettings = useMemo(() => {
    const settingsObject = {
      review_title: 'Use Proofs',
    } as ActionSettings;

    switch (action) {
      case RevolutAction.REGISTRATION:
        settingsObject.navigate_title = 'Navigate to Account';
        settingsObject.request_title = 'Prove RevTag';
        settingsObject.action_url = 'https://app.revolut.com/home';
        settingsObject.navigate_instruction = 'Go to the Account page on Revolut to load your account\'s RevTag';
        settingsObject.request_instruction = 'Notarize the RevTag, this can take up to 30 seconds';
        settingsObject.review_instruction = 'Successful notarizations can now be used in zkp2p.xyz to register';

        const registrationBookmark = bookmarks[0];
        settingsObject.bookmark_data = {
          secretResponseSelector: registrationBookmark.secretResponseSelector,
          metaDataSelector: registrationBookmark.metaDataSelector,
          skipRequestHeaders: registrationBookmark.skipRequestHeaders,
          includeRequestCookies: registrationBookmark.includeRequestCookies,
          maxSentData: registrationBookmark.maxSentData,
          maxRecvData: registrationBookmark.maxRecvData
        };
        break;

      case RevolutAction.TRANSFER:
        settingsObject.navigate_title = 'Navigate to Transactions';
        settingsObject.request_title = 'Prove Completed Payment';
        settingsObject.action_url = 'https://app.revolut.com/home';
        settingsObject.navigate_instruction = 'Open the Transaction for the completed payment'
        settingsObject.request_instruction = 'Notarize the transaction, this can take up to 30 seconds'
        settingsObject.review_instruction = 'Successful notarizations can now be used in zkp2p.xyz to on-ramp'

        const transferBookmark = bookmarks[1];
        settingsObject.bookmark_data = {
          secretResponseSelector: transferBookmark.secretResponseSelector,
          metaDataSelector: transferBookmark.metaDataSelector,
          skipRequestHeaders: transferBookmark.skipRequestHeaders,
          includeRequestCookies: transferBookmark.includeRequestCookies,
          maxSentData: transferBookmark.maxSentData,
          maxRecvData: transferBookmark.maxRecvData
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
        <StepContainer>
          <InstructionTitle
            title={actionSettings.navigate_title}
            description={actionSettings.navigate_instruction}
            step={RevolutStep.NAVIGATE}
          />

          <ButtonContainer>
            <Button
              onClick={() => handleCreateTab()}
              width={164}
              height={40}
              fontSize={14}
            >
              Go to Revolut
            </Button>
          </ButtonContainer>
        </StepContainer>

        <StepContainer>
          <InstructionTitle
            title={actionSettings.request_title}
            description={actionSettings.request_instruction}
            step={RevolutStep.PROVE}
          />

          <RequestTableAndButtonContainer>
            <RequestTable
              action={action}
              requests={filteredRequests}
              setSelectedIndex={setSelectedIndex}
              selectedIndex={selectedIndex}
            />

            <ButtonContainer>
              <Button
                disabled={filteredRequests.length === 0}
                onClick={() => handleNotarizePressed()}
                width={164}
                height={40}
                fontSize={14}
              >
                Notarize
              </Button>
            </ButtonContainer>
          </RequestTableAndButtonContainer>
        </StepContainer>

        <StepContainer>
          <InstructionTitle
            title={actionSettings.review_title}
            description={actionSettings.review_instruction}
            step={RevolutStep.REVIEW}
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
              Back to ZKP2P
            </Button>
          </ButtonContainer>
        </StepContainer>
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
  display: grid;
  grid-template-rows: .4fr 1fr 1fr;
  min-height: 85vh;
  border-radius: 16px;
  gap: 1.5rem;
`;

const StepContainer = styled.div`
  display: flex;
  flex-direction: column;
  justify-content: center;
  gap: 0.75rem;
`;

const RequestTableAndButtonContainer = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
`;

const ButtonContainer = styled.div`
  display: flex;
  justify-content: center;
  align-items: center;
`;

export default Revolut;
