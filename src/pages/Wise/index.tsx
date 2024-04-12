import React, { useEffect, useMemo, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import styled from 'styled-components';
import deepEqual from 'fast-deep-equal';
import { AppRootState } from 'reducers';
import browser from 'webextension-polyfill';

import { notarizeRequest, setActiveTab, useActiveTabUrl, useRequests } from '../../reducers/requests';
import { useHistoryOrder } from '../../reducers/history';
import { ThemedText } from '@theme/text';
import { colors } from '@theme/colors';

import NotarizationTable from '@newcomponents/Notarizations/Table';
import RequestTable from '@newcomponents/Requests/Table';
import { InstructionStep } from '@newcomponents/Instructions/Step';
import { Button } from '@newcomponents/common/Button';
import { WiseAction, WiseActionType } from '@utils/types';
import { replayRequest, urlify } from '@utils/misc';
import { get, NOTARY_API_LS_KEY, PROXY_API_LS_KEY } from '@utils/storage';

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
  const notarizations = requestHistoryOrder.map((id) => useSelector((state: AppRootState) => state.history.map[id], deepEqual));

  /*
   * State
   */

  const [originalTabId, setOriginalTabId] = useState<number | null>(null);
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);

  /*
   * Hooks
   */

  useEffect(() => {
    const requestsRetrieved = requests.length > 0;
    const indexNotSelected = selectedIndex === null;

    if (requestsRetrieved && indexNotSelected) {
      setSelectedIndex(0);
    }
  }, [requests, selectedIndex]);

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

  const handleNotarizePressed = async() => {
    if (selectedIndex === null) {
      return;
    }

    console.log('Attempting to notarize', selectedIndex);

    const requestLog = requests[selectedIndex];
    const response = await replayRequest(requestLog);
    const secretHeaders = requestLog.requestHeaders
      .map((headers) => {
        return `${headers.name.toLowerCase()}: ${headers.value || ''}` || '';
      })
      .filter((d) => !!d);

    const secretResps = [] as string[];

    actionSettings.bookmark_data.secretResponseSelector.forEach((secretResponseSelector) => {
      const regex = new RegExp(secretResponseSelector, 'g');

      // console.log(response.text);
      const matches = response.text.match(regex);
      // console.log('secretResponseSelector', secretResponseSelector);

      if (matches) {
        const hidden = matches[0];

        const selectionStart = response.text.indexOf(hidden);
        const selectionEnd = selectionStart + hidden.length;

        if (selectionStart !== -1) {
          secretResps.push(response.text.substring(selectionStart, selectionEnd));
        }
        // console.log('secretResps', secretResps);
      }
    });

    // Filter out any empty strings
    const filteredSecretResps = secretResps.filter((d) => !!d);

    const hostname = urlify(requestLog.url)?.hostname;
    const notaryUrl = 'https://notary-california.zkp2p.xyz' // await get(NOTARY_API_LS_KEY);
    const websocketProxyUrl = 'wss://proxy-california.zkp2p.xyz' // await get(PROXY_API_LS_KEY);

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
    const requestDate = response.response.headers.get('date') || response.response.headers.get('Date');
    if (requestDate) {
      metadataResp.push(requestDate);
    }

    actionSettings.bookmark_data.metaDataSelector.forEach((metaDataSelector) => {
      const regex = new RegExp(metaDataSelector, 'g');

      console.log(response.text);
      const matches = response.text.match(regex);
      console.log('metaDataSelector', metaDataSelector);

      if (matches) {
        const revealed = matches[0];

        const selectionStart = response.text.indexOf(revealed);
        const selectionEnd = selectionStart + revealed.length;

        if (selectionStart !== -1) {
          metadataResp.push(response.text.substring(selectionStart, selectionEnd));
        }
        console.log('metadataResp', metadataResp);
      }
    });

    console.log('dispatching notarizeRequest');

    dispatch(
      notarizeRequest({
        url: requestLog.url,
        method: requestLog.method,
        headers: headers,
        body: requestLog.requestBody,
        maxTranscriptSize: 16384,
        notaryUrl,
        websocketProxyUrl,
        secretHeaders,
        secretResps: filteredSecretResps,
        metadata: metadataResp,
        originalTabId: originalTabId
      }),
    );
  };

  /*
   * Helpers
   */

  const actionSettings = useMemo(() => {
    const settingsObject = {
      navigate_title: 'Navigate to Wise',
      request_title: 'Prove Requests',
      review_title: 'Use Proofs',
    } as ActionSettings;

    switch (action) {
      case WiseAction.REGISTRATION:
        settingsObject.action_url = 'https://wise.com/account/payments';
        settingsObject.navigate_instruction = 'Go to the account page on Wise to listen for the correct request';
        settingsObject.request_instruction = 'Notarize a request, this will take approximately 20 seconds';
        settingsObject.review_instruction = 'Succesfully notarized proofs will appear here and in zkp2p.xyz for submission';

        const registrationBookmark = bookmarks[0];
        settingsObject.bookmark_data = {
          secretResponseSelector: registrationBookmark.secretResponseSelector,
          metaDataSelector: registrationBookmark.metaDataSelector,
        };
        break;


      case WiseAction.DEPOSITOR_REGISTRATION:
        settingsObject.action_url = 'https://wise.com/all-transactions?direction=OUTGOING';
        settingsObject.navigate_instruction = 'Go to the account page on Wise to listen for the correct request'
        settingsObject.request_instruction = 'Notarize a request, this will take approximately 20 seconds'
        settingsObject.review_instruction = 'Succesfully notarized proofs will appear here and in zkp2p.xyz for submission'

        const depositorRegistrationBookmark = bookmarks[1];
        settingsObject.bookmark_data = {
          secretResponseSelector: depositorRegistrationBookmark.secretResponseSelector,
          metaDataSelector: depositorRegistrationBookmark.metaDataSelector,
        };
        break;

      case WiseAction.TRANSFER:
        settingsObject.action_url = 'https://wise.com/all-transactions?direction=OUTGOING';
        settingsObject.navigate_instruction = 'Go to the account page on Wise to listen for the correct request'
        settingsObject.request_instruction = 'Notarize a request, this will take approximately 20 seconds'
        settingsObject.review_instruction = 'Succesfully notarized proofs will appear here and in zkp2p.xyz for submission'

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
          <TitleAndInstructionContainer>
            <ThemedText.TableHeaderSmall style={{ flex: '1', textAlign: 'left' }}>
              { actionSettings.navigate_title }
            </ThemedText.TableHeaderSmall>

            <InstructionStep>
              { actionSettings.navigate_instruction }
            </InstructionStep>
          </TitleAndInstructionContainer>

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

        {/* <VerticalDivider /> */}

        <BodyStepContainer>
          <TitleAndInstructionContainer>
            <ThemedText.TableHeaderSmall style={{ flex: '1', textAlign: 'left' }}>
              { actionSettings.request_title }
            </ThemedText.TableHeaderSmall>

            <InstructionStep>
              { actionSettings.request_instruction }
            </InstructionStep>
          </TitleAndInstructionContainer>

          <RequestTableAndButtonContainer>
            <RequestTable
              requests={requests}
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

        {/* <VerticalDivider /> */}

        <BodyStepContainer>
          <TitleAndInstructionContainer>
            <ThemedText.TableHeaderSmall style={{ flex: '1', textAlign: 'left' }}>
              { actionSettings.review_title }
            </ThemedText.TableHeaderSmall>

            <InstructionStep>
              { actionSettings.review_instruction }
            </InstructionStep>
          </TitleAndInstructionContainer>

          <NotarizationTable
            requests={notarizations}
          />
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
  padding-top: 1rem;
  gap: 1.5rem;
`;

const BodyStepContainer = styled.div`
  display: flex;
  flex-direction: column;
  justify-content: flex-start;
  gap: 0.25rem;
`;

const TitleAndInstructionContainer = styled.div`
  display: flex;
  flex-direction: column;
  justify-content: flex-start;
  padding: 0rem 0.25rem 0.55rem 0.25rem;
  gap: 0.25rem;

  color: ${colors.white};
  font-size: 14px;
`;

const RequestTableAndButtonContainer = styled.div`
  display: flex;
  flex-direction: column;
  gap: 1rem;
`;

const ButtonContainer = styled.div`
  margin: auto;
`;

// const VerticalDivider = styled.div`
//   height: 20px;
//   border-left: 1px solid ${colors.defaultBorderColor};
//   margin: 0 auto;
// `;

export default Wise;
