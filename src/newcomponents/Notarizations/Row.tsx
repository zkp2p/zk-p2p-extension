import React from 'react';
import styled from 'styled-components';

import { colors } from '@theme/colors';
import Spinner from '@newcomponents/common/Spinner';


interface RequestRowProps {
  subjectText: string;
  dateText: string;
  isLastRow: boolean;
  onRowClick: () => void;
  rowIndex: number;
  isProving?: boolean;
}

export const RequestRow: React.FC<RequestRowProps> = ({
  subjectText,
  dateText,
  isLastRow,
  onRowClick,
  rowIndex,
  isProving = false,
}: RequestRowProps) => {
  RequestRow.displayName = 'RequestRow';

  const subjectLabel = `${subjectText}`;
  const dateLabel = `${dateText}`;

  return (
    <Container onClick={onRowClick} lastRow={isLastRow}>
      <IndexLabel> {rowIndex} </IndexLabel>
      <SubjectLabel> {subjectLabel} </SubjectLabel>
      {isProving ? (
        <SpinnerContainer>
          <Spinner size={20}/>
        </SpinnerContainer>
      ) : (
        <DateLabel>{dateLabel}</DateLabel>
      )}
    </Container>
  );
};

const Container = styled.div<{ lastRow: boolean }>`
  display: grid;
  grid-template-columns: 0.1fr 1fr 0.4fr;
  grid-gap: 1px;
  padding: 0.75rem 1rem;
  font-size: 14px;
  color: #ffffff;
  
  border-radius: ${({ lastRow }) => (lastRow ? '0 0 8px 8px' : '0')};
  border-bottom: ${({ lastRow }) => !lastRow && `1px solid ${colors.defaultBorderColor}`};
`;

const IndexLabel = styled.label`
  text-align: left;
`;

const SubjectLabel = styled.label`
  text-align: left;
`;

const SpinnerContainer = styled.div`
  display: flex;
  justify-content: flex-end;
`;

const DateLabel = styled.label`
  text-align: right;
`;
