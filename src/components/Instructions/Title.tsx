import React from 'react';
import styled from 'styled-components';
import { Cpu, Globe, ArrowLeftCircle } from 'react-feather';

import { colors } from '@theme/colors';
import { ThemedText } from '@theme/text';
import { RevolutStep, RevolutStepType } from '@utils/types';
import { InstructionStep } from '@components/Instructions/Step';


interface InstructionTitleProps {
  title: string,
  description: string,
  step: RevolutStepType
}

export const InstructionTitle: React.FC<InstructionTitleProps> = ({
  title,
  description,
  step
}: InstructionTitleProps) => {
  InstructionTitle.displayName = 'InstructionTitle';

  /*
   * Helpers
   */

  const getActionIcon = (step: RevolutStepType) => {
    switch (step) {
      case RevolutStep.NAVIGATE:
        return <StyledGlobe />;
      case RevolutStep.PROVE:
        return <StyledCpu />;
      case RevolutStep.REVIEW:
        return <StyledArrowLeft />;
      default:
    }
  };

  /*
   * Component
   */

  return (
    <Container>
      { getActionIcon(step) }

      <TitleAndDescriptionContainer>
        <ThemedText.TableHeaderSmall style={{ flex: '1', textAlign: 'left' }}>
          { title }
        </ThemedText.TableHeaderSmall>

        <InstructionStep>
          { description  }
        </InstructionStep>
      </TitleAndDescriptionContainer>
    </Container>
  );
};

const Container = styled.div`
  display: flex;
  flex-direction: row;
  justify-content: flex-start;
  align-items: center;
  gap: 1rem;
`;

const TitleAndDescriptionContainer = styled.div`
  display: flex;
  flex-direction: column;
  justify-content: flex-start;
  padding: 0rem 0.25rem;
  gap: 0.25rem;

  color: ${colors.white};
  font-size: 14px;
`;

const StyledGlobe = styled(Globe)`
  color: #fff;
  width: 32px;
  height: 32px;
`;

const StyledCpu = styled(Cpu)`
  color: #fff;
  width: 32px;
  height: 32px;
`;

const StyledArrowLeft = styled(ArrowLeftCircle)`
  color: #fff;
  width: 32px;
  height: 24px;
`;
