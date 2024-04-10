import React from 'react';
import styled from 'styled-components';

import { colors } from '@theme/colors';


interface RequestRowProps {
  subjectText: string;
  dateText: string;
  isSelected: boolean;
  isLastRow: boolean;
  onRowClick: () => void;
  rowIndex: number;
}

export const RequestRow: React.FC<RequestRowProps> = ({
  subjectText,
  dateText,
  isSelected,
  isLastRow,
  onRowClick,
  rowIndex,
}: RequestRowProps) => {
  RequestRow.displayName = 'RequestRow';

  const subjectLabel = `${subjectText}`;
  const dateLabel = `${dateText}`;

  return (
    <Container onClick={onRowClick} selected={isSelected} isLastRow={isLastRow}>
      <IndexLabel> {rowIndex} </IndexLabel>
      <SubjectLabel> {subjectLabel} </SubjectLabel>
      <DateLabel> {dateLabel} </DateLabel>
    </Container>
  );
};

const Container = styled.div<{ selected: boolean; isLastRow: boolean }>`
  display: grid;
  grid-template-columns: 0.2fr 1fr 0.2fr;
  grid-gap: 1px;
  padding: 1rem 1rem 0.75rem 1rem;
  font-size: 14px;
  color: #ffffff;
  border-radius: ${({ isLastRow }) => (isLastRow ? '0 0 8px 8px' : '0')};
  border-bottom: ${({ isLastRow }) => !isLastRow && `1px solid ${colors.defaultBorderColor}`};
  ${({ selected }) =>
    selected &&
    `
    background-color: #191D28;
    box-shadow: none;
  `}
  ${({ selected, isLastRow }) =>
    !selected &&
    `
    &:hover {
      background-color: #191D28;
      border-radius: ${isLastRow ? '0 0 8px 8px' : '0'};
      box-shadow: none;
    }
  `}
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
