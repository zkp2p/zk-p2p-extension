import React from "react";
import styled from 'styled-components';
import { X, AlertTriangle } from 'react-feather';

import { Overlay } from '@newcomponents/common/Overlay';
import { Button } from '@newcomponents/common/Button';
import { ThemedText } from '@theme/text'
import { colors } from '@theme/colors';


interface SessionExpiredModalProps {
  onBackClick: () => void
}

export const SessionExpiredModal: React.FC<SessionExpiredModalProps> = ({
  onBackClick,
}) => {
  /*
   * Handlers
   */

  const handleOverlayClick = () => {
    onBackClick();
  }

  /*
   * Component
   */

  return (
    <ModalAndOverlayContainer>
      <Overlay />

      <ModalContainer>
        <TitleCenteredRow>
          <div style={{ flex: 0.25 }}>
            <button
              onClick={handleOverlayClick}
              style={{ background: 'none', border: 'none', cursor: 'pointer' }}
              >

              <StyledX/>
            </button>
          </div>

          <ThemedText.LabelSmall style={{ flex: '1', margin: 'auto', textAlign: 'center' }}>
            Session Expired
          </ThemedText.LabelSmall>

          <div style={{ flex: 0.25 }}/>
        </TitleCenteredRow>

        <InstructionsContainer>
          <InstructionsLabel>
            The selected request has expired. Log in to or refresh Revolut again to generate a new request to prove
          </InstructionsLabel>
        </InstructionsContainer>

        <Button
          onClick={() => onBackClick()}
          width={164}
          height={40}
          fontSize={14}
        >
          Go back
        </Button>
      </ModalContainer>
    </ModalAndOverlayContainer>
  );
};

const ModalAndOverlayContainer = styled.div`
  width: 100vw;
  height: 100vh;
  display: flex;
  justify-content: center;
  position: fixed;
  align-items: flex-start;
  top: 0;
  left: 0;
  z-index: 10;
`;

const ModalContainer = styled.div`
  width: 80vw;
  display: flex;
  flex-direction: column;
  border-radius: 16px;
  border: 1px solid rgba(255, 255, 255, 0.2);
  padding: 1.25rem 1rem;
  background-color: ${colors.container};
  justify-content: space-between;
  align-items: center;
  z-index: 20;
  gap: 1rem;
  
  position: fixed;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
`;

const TitleCenteredRow = styled.div`
  width: 100%;
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 1.5rem;
  color: #FFF;
`;

const StyledX = styled(X)`
  width: 20px;
  height: 20px;
  color: #FFF;
`;

const InstructionsContainer = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  align-items: center;
  padding: 0 1rem;
  color: #FFF;
`;

const InstructionsLabel = styled.div`
  font-size: 14px;
  text-align: center;
  line-height: 1.3;
`;
