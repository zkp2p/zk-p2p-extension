import React, { useState } from 'react';
import { useSelector } from 'react-redux';
// import { useNavigate } from 'react-router';
import styled from 'styled-components';
import deepEqual from 'fast-deep-equal';
import { AppRootState } from 'reducers';

import { useRequests } from '../../reducers/requests';
import { useHistoryOrder } from '../../reducers/history';
import { ThemedText } from '@theme/text';
import { colors } from '@theme/colors';

import NotarizationTable from '@newcomponents/Notarizations/Table';
import RequestTable from '@newcomponents/Requests/Table';


export default function DepositorRegistration() {
  // const navigate = useNavigate();

  /*
   * Contexts
   */

  const requests = useRequests(); // RequestLog
  const requestHistoryOrder = useHistoryOrder(); // RequestHistory
  const notarizations = requestHistoryOrder.map((id) => useSelector((state: AppRootState) => state.history.map[id], deepEqual));

  /*
   * State
   */

  // const [selectedIndex, setSelectedIndex] = useState<number | null>(null);

  /*
   * Component
   */

  return (
    <Container>
      <BodyContainer>
        <TitleAndTableContainer>
          <TitleContainer>
            <ThemedText.TableHeaderSmall style={{ flex: '1', margin: 'auto', textAlign: 'left' }}>
              Proofs
            </ThemedText.TableHeaderSmall>
          </TitleContainer>

          <NotarizationTable
            requests={notarizations}
          />
        </TitleAndTableContainer>

        <InstructionsContainer>
          <ThemedText.SubHeaderSmall textAlign="left" lineHeight={1.3}>
            Test
          </ThemedText.SubHeaderSmall>
        </InstructionsContainer>

        <TitleAndTableContainer>
          <TitleContainer>
            <ThemedText.TableHeaderSmall style={{ flex: '1', margin: 'auto', textAlign: 'left' }}>
              Request
            </ThemedText.TableHeaderSmall>
          </TitleContainer>

          <RequestTable
            requests={requests}
          />
        </TitleAndTableContainer>
      </BodyContainer>
    </Container>
  );
}

const Container = styled.div`
  width: 100%;
  align-self: flex-start;
  justify-content: center;
  border-radius: 16px;
  padding: 0rem 1.5rem;
  gap: 1rem;
`;

const TitleContainer = styled.div`
  padding-bottom: 1rem;
  color: ${colors.white};
  font-size: 14px;
`;

const BodyContainer = styled.div`
  display: flex;
  flex-direction: column;
  gap: 1rem;
  border-radius: 16px;
`;

const TitleAndTableContainer = styled.div`
  color: ${colors.white};
`;

const InstructionsContainer = styled.div`
`;
