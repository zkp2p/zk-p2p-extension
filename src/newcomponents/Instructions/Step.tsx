import React from 'react';

import styled from "styled-components";


export const InstructionStep: React.FC<{
  step?: number;
  children: React.ReactNode;
}> = ({ step, children }) => {
  return (
    <Container>
      {step !== undefined && (
        <Label>
          <span>{step}.</span>
        </Label>
      )}
      <InstructionStepText>{children}</InstructionStepText>
    </Container>
  );
};

const Container = styled.div`
  display: flex;
  align-items: center;
  gap: 0.75rem;
  border-radius: 12px;
  color: #CED4DA;
  line-height: 1.35;
`;

const Label = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 4px;
  width: 12px;
  height: 12px;
  font-size: 14px;
`;

const InstructionStepText = styled.span`
  font-size: 14px;
`;
