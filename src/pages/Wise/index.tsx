import React, { useMemo, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import styled from 'styled-components';
import deepEqual from 'fast-deep-equal';
import { AppRootState } from 'reducers';
import browser from 'webextension-polyfill';

import { setActiveTab, useActiveTabUrl, useRequests } from '../../reducers/requests';
import { useHistoryOrder } from '../../reducers/history';
import { ThemedText } from '@theme/text';
import { colors } from '@theme/colors';

import NotarizationTable from '@newcomponents/Notarizations/Table';
import RequestTable from '@newcomponents/Requests/Table';
import { InstructionStep } from '@newcomponents/Instructions/Step';
import { Button } from '@newcomponents/common/Button';
import { WiseAction, WiseActionType } from '@utils/types';


interface ActionSettings {
  action_url: string;
  navigate_title: string;
  navigate_instruction: string;
  request_title: string;
  request_instruction: string;
  review_title: string;
  review_instruction: string;
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

  const requests = useRequests(); // RequestLog
  const requestHistoryOrder = useHistoryOrder(); // RequestHistory
  const notarizations = requestHistoryOrder.map((id) => useSelector((state: AppRootState) => state.history.map[id], deepEqual));

  /*
   * State
   */

  const [originalTabId, setOriginalTabId] = useState<number | null>(null);

  /*
   * Handlers
   */

  const handleCreateTab = async() => {
    const [tab] = await browser.tabs.query({
      active: true,
      lastFocusedWindow: true,
    });

    if (tab) {
      console.log('originalTabId123', tab.id);
      setOriginalTabId(tab.id || null);
    }

    chrome.tabs.create({
      url: actionSettings.action_url
    }).then(newTab => {
      dispatch(setActiveTab(newTab))
    })
  };

  /*
   * Helpers
   */

  const actionSettings = useMemo(() => {
    const settingsObject = {
      navigate_title: 'Navigate to Wise',
      request_title: 'Prove Requests',
      review_title: 'Review Proofs',
    } as ActionSettings;

    switch (action) {
      case WiseAction.REGISTRATION:
        settingsObject.action_url = 'https://wise.com/account/payments';
        settingsObject.navigate_instruction = 'Go to the account page on Wise to listen for the correct request';
        settingsObject.request_instruction = 'Select a valid request to notarize';
        settingsObject.review_instruction = 'Succesfully notarized proofs will appear here and in zkp2p.xyz for submission';
        break;


      case WiseAction.DEPOSITOR_REGISTRATION:
        settingsObject.action_url = 'https://wise.com/all-transactions?direction=OUTGOING';
        settingsObject.navigate_instruction = 'Go to the account page on Wise to listen for the correct request'
        settingsObject.request_instruction = 'Select a valid request to notarize'
        settingsObject.review_instruction = 'Succesfully notarized proofs will appear here and in zkp2p.xyz for submission'
        break;

      case WiseAction.TRANSFER:
        settingsObject.action_url = 'https://wise.com/all-transactions?direction=OUTGOING';
        settingsObject.navigate_instruction = 'Go to the account page on Wise to listen for the correct request'
        settingsObject.request_instruction = 'Select a valid request to notarize'
        settingsObject.review_instruction = 'Succesfully notarized proofs will appear here and in zkp2p.xyz for submission'
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
              disabled={false}
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
          <TitleAndInstructionContainer>
            <ThemedText.TableHeaderSmall style={{ flex: '1', textAlign: 'left' }}>
              { actionSettings.request_title }
            </ThemedText.TableHeaderSmall>

            <InstructionStep>
              { actionSettings.request_instruction }
            </InstructionStep>
          </TitleAndInstructionContainer>

          <RequestTable
            requests={requests}
          />
        </BodyStepContainer>

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
  gap: 1rem;
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
`;

const TitleAndInstructionContainer = styled.div`
  display: flex;
  flex-direction: column;
  justify-content: flex-start;
  padding: 0rem 0.25rem 1rem 0.25rem;
  gap: 0.25rem;

  color: ${colors.white};
  font-size: 14px;
`;

const ButtonContainer = styled.div`
  margin: auto;
`;

export default Wise;
