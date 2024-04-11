import React from 'react';
import styled from 'styled-components';

import { colors } from '@theme/colors';


interface RequestRowProps {
  subjectText: string;
  dateText: string;
  isLastRow: boolean;
  onRowClick: () => void;
  rowIndex: number;
}

export const RequestRow: React.FC<RequestRowProps> = ({
  subjectText,
  dateText,
  isLastRow,
  onRowClick,
  rowIndex,
}: RequestRowProps) => {
  RequestRow.displayName = 'RequestRow';

  const subjectLabel = `${subjectText}`;
  const dateLabel = `${dateText}`;

  return (
    <Container onClick={onRowClick} isLastRow={isLastRow}>
      <IndexLabel> {rowIndex} </IndexLabel>
      <SubjectLabel> {subjectLabel} </SubjectLabel>
      <DateLabel> {dateLabel} </DateLabel>
    </Container>
  );
};

const Container = styled.div<{ isLastRow: boolean }>`
  display: grid;
  grid-template-columns: 0.1fr 1fr 0.3fr;
  grid-gap: 1px;
  padding: 1rem 1rem 0.75rem 1rem;
  font-size: 14px;
  color: #ffffff;
  border-radius: ${({ isLastRow }) => (isLastRow ? '0 0 8px 8px' : '0')};
  border-bottom: ${({ isLastRow }) => !isLastRow && `1px solid ${colors.defaultBorderColor}`};
`;

const IndexLabel = styled.label`
  text-align: left;
`;

const SubjectLabel = styled.label`
  text-align: left;
`;

const DateLabel = styled.label`
  text-align: right;
`;
