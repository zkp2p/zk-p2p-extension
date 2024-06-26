import { parse as parseCookie } from 'cookie';
import React, { useEffect, useMemo, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import styled from 'styled-components';
import deepEqual from 'fast-deep-equal';
import { AppRootState } from 'reducers';
import browser from 'webextension-polyfill';

import { BackgroundActiontype, RequestHistory, RequestLog } from '@entries/Background/rpc';
import { Button } from '@components/common/Button';
import { InstructionTitle } from '@components/Instructions/Title';
import NotarizationTable from '@components/Notarizations/TronScan/Table';
import RequestTable from '@components/Requests/TronScan/Table';
import { SessionExpiredModal } from '../../pages/Revolut/SessionExpiredModal';
import { notarizeRequest, setActiveTab, useActiveTabUrl, useRequests, deletedSingleRequestLog } from '@reducers/requests';
import { useHistoryOrder } from '@reducers/history';
import { urlify } from '@utils/misc';
import { RevolutAction, RevolutStep } from '@utils/types';
import bookmarks from '../../../utils/bookmark/tronScan.json';


const REQUEST_LOG_EXPIRATION_MINUTES = 3;

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

interface TronscanProps {
  action: "TRONSCAN_TRANSFER";
}

const Tronscan: React.FC<TronscanProps> = ({
  action
}) => {
  const dispatch = useDispatch();
  const activeTabUrl = useActiveTabUrl();

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
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);
  const [validNotarizationExists, setValidNotarizationExists] = useState<boolean>(false);

  const [filteredRequests, setFilteredRequests] = useState<RequestLog[]>([]);
  const [loadedNotarizations, setLoadedNotarizations] = useState<RequestHistory[]>([]);

  const [shouldShowExpiredModal, setShouldShowExpiredModal] = useState<boolean>(false);

  /*
   * Hooks
   */

  useEffect(() => {
    const requestsRetrieved = filteredRequests.length > 0;
    const indexNotSelected = selectedIndex === null;

    if (requestsRetrieved && indexNotSelected) {
      setSelectedIndex(0);
    }
  }, [filteredRequests, selectedIndex]);

  useEffect(() => {
    if (notarizations) {
      const filteredNotarizations = notarizations.filter(notarization => {
        switch (action) {
          case 'TRONSCAN_TRANSFER':
            return notarization.requestType === "tron_transfer";

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
    console.log('requestsFromStorage', requestsFromStorage);

    if (requestsFromStorage) {
      const filteredRequests = requestsFromStorage.filter(request => {
        switch (action) {
          case 'TRONSCAN_TRANSFER':
            return request.requestType === "tron_transfer";

          default:
            return false;
        }
      });

      // console.log('Setting filtered requests', filteredRequests);
      setFilteredRequests(filteredRequests);
    } else {

      // console.log('Setting empty filtered requests');
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
    };

    // Grab selected RequestLog
    const requestLog = filteredRequests[selectedIndex];

    // Check for session expiration
    const requestTimestamp = requestLog.timestamp;
    const now = Date.now();
    const timeDifference = now - requestTimestamp;
    if (timeDifference > REQUEST_LOG_EXPIRATION_MINUTES * 60 * 1000) {
      dispatch(
        deletedSingleRequestLog(requestLog.requestId) as any
      );

      setShouldShowExpiredModal(true);
      return;
    };

    // Build notarization parameters
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
    // let cookies = parseCookie(headers['Cookie']);
    // const filteredCookies = actionSettings.bookmark_data.includeRequestCookies.map(cookie => {
    //   return `${cookie}=${cookies[cookie]}`;
    // }).join(`; `);

    // headers['Cookie'] = filteredCookies;
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
      secretHeaders,
      secretResps: filteredSecretResps,
      metadata: metadataResp,
      originalTabId: originalTabId,
      requestType: requestLog.requestType,
    } as RequestHistory;

    // Creates RequestHistory

    dispatch(
      notarizeRequest(notarizeRequestParams) as any
    );
  };

  /*
   * Helpers
   */
  
  const shouldDisableRevolutButton = useMemo(() => {

    if (activeTabUrl) {
      const isValidRevolutURL = /^https:\/\/app\.revolut\.com\/home.*/.test(activeTabUrl.href);
  
      return isValidRevolutURL;
    }
  }, [activeTabUrl]);

  const urlForAction = useMemo(() => {
    switch (action) {
      case "TRONSCAN_TRANSFER":
        return 'https://zkp2p.xyz/register';

      default:
        return 'https://zkp2p.xyz';
    }
  }, [action]);

  const actionSettings = useMemo(() => {
    const settingsObject = {
      review_title: 'Use Proofs',
    } as ActionSettings;

    switch (action) {
      case "TRONSCAN_TRANSFER":
        settingsObject.navigate_title = 'Navigate to Transfer';
        settingsObject.request_title = 'Prove Transfer';
        settingsObject.action_url = 'https://tronscan.org/';
        settingsObject.navigate_instruction = 'Go to the Transfer page on TronScan to load the transfer details';
        settingsObject.request_instruction = 'Notarize the transfer details, this can take up to 30 seconds';
        settingsObject.review_instruction = 'Successful notarizations can now be used in zkp2p.xyz to on-ramp';

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
    }

    return settingsObject;
  }, [action]);

  /*
   * Component
   */

  return (
    <Container>
      {shouldShowExpiredModal && (
        <SessionExpiredModal
          onBackClick={() => setShouldShowExpiredModal(false)}
        />
      )}

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
              disabled={shouldDisableRevolutButton}
              width={164}
              height={40}
              fontSize={14}
            >
              Go to TronScan
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
  height: 100%;
  justify-content: center;
  border-radius: 16px;
  padding: 0rem 1.5rem;
  
  overflow: auto;
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

export default Tronscan;
