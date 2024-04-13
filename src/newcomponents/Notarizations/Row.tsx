import React from 'react';
import styled from 'styled-components';
import { Trash2, X, Check } from 'react-feather';

import { colors } from '@theme/colors';
import Spinner from '@newcomponents/common/Spinner';


interface NotarizationRowProps {
  subjectText: string;
  dateText: string;
  isLastRow: boolean;
  onRowClick: () => void;
  rowIndex: number;
  isProving?: boolean;
  isFailed?: boolean;
  onDeleteClicked?: () => void;
}

export const NotarizationRow: React.FC<NotarizationRowProps> = ({
  subjectText,
  dateText,
  isLastRow,
  onRowClick,
  rowIndex,
  isProving = false,
  isFailed = false,
  onDeleteClicked
}: NotarizationRowProps) => {
  NotarizationRow.displayName = 'NotarizationRow';

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
      ) : isFailed ? (
        <FailedIconsContainer>
          <StyledTrashIcon onClick={(e) => {
            e.stopPropagation();
            if (onDeleteClicked) {
              onDeleteClicked(); 
            }
          }} />

          <StyledXIcon/>
        </FailedIconsContainer>
      ) : (
        // <DateLabel>{dateLabel}</DateLabel>
        <StyledCheck />
      )}
    </Container>
  );
};

const Container = styled.div<{ lastRow: boolean }>`
  display: grid;
  grid-template-columns: 0.1fr 1fr 0.4fr;
  grid-gap: 1px;
  padding: 0.85rem 1rem 0.75rem 1rem;
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

const FailedIconsContainer = styled.div`
  display: flex;
  justify-content: flex-end;
  align-items: center;
  gap: 8px;
`;

const StyledCheck = styled(Check)`
  color: ${colors.successGreen};
  height: 16px;
  width: 16px;
`;

const StyledTrashIcon = styled(Trash2)`
  height: 16px;
  width: 16px;

  &:hover:not([disabled]) {
    color: #495057;
  }
`;

const StyledXIcon = styled(X)`
  color: ${colors.warningRed};
  height: 16px;
  width: 16px;
`;
