import React from 'react';
import styled from 'styled-components';

import { colors } from '@theme/colors';


interface RequestRowProps {
  subjectText: string;
  dateText: string;
  isLastRow: boolean;
  onRowClick: () => void;
  isSelected: boolean;
  rowIndex: number;
}

export const RequestRow: React.FC<RequestRowProps> = ({
  subjectText,
  dateText,
  isLastRow,
  onRowClick,
  isSelected,
  rowIndex,
}: RequestRowProps) => {
  RequestRow.displayName = 'RequestRow';

  const subjectLabel = `${subjectText}`;
  const dateLabel = `${dateText}`;

  return (
    <Container
      onClick={onRowClick}
      isLastRow={isLastRow}
      selected={isSelected}
    >
      <IndexLabel> {rowIndex} </IndexLabel>
      <SubjectLabel> {subjectLabel} </SubjectLabel>
      <DateLabel> {dateLabel} </DateLabel>
    </Container>
  );
};

const Container = styled.div<{ selected: boolean; isLastRow: boolean }>`
  display: grid;
  grid-template-columns: 0.1fr 1fr 0.4fr;
  grid-gap: 1px;
  padding: 1.1rem 1rem 1rem 1rem;
  font-size: 14px;
  color: #ffffff;
  
  border-radius: ${({ isLastRow }) => (isLastRow ? '0 0 8px 8px' : '0')};
  border-bottom: ${({ isLastRow }) => !isLastRow && `1px solid ${colors.defaultBorderColor}`};

  ${({ selected }) => selected && `
    background-color: #191D28;
    box-shadow: none;
  `}

  ${({ selected, isLastRow }) => !selected && `
    &:hover {
      background-color: #191D28;
      border-radius: ${isLastRow ? "0 0 8px 8px" : "0"};
      box-shadow: none;
    }
  `}

  cursor: pointer;
`;

const IndexLabel = styled.label`
  text-align: left;
  cursor: pointer;
`;

const SubjectLabel = styled.label`
  text-align: left;
  cursor: pointer;
`;

const DateLabel = styled.label`
  text-align: right;
  cursor: pointer;
`;
