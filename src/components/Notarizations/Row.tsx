import React from 'react';
import styled from 'styled-components';
import { Trash2, X, Check, Download } from 'react-feather';

import { colors } from '@theme/colors';
import Spinner from '@components/common/Spinner';
import { download } from '@utils/misc';

interface NotarizationRowProps {
  subjectText: string;
  dateText: string;
  isLastRow: boolean;
  onRowClick: () => void;
  rowIndex: number;
  isProving?: boolean;
  isFailed?: boolean;
  requestHistoryId: string;
  proof: { session: any; substrings: any };
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
  onDeleteClicked,
  requestHistoryId,
  proof
}: NotarizationRowProps) => {
  NotarizationRow.displayName = 'NotarizationRow';

  const subjectLabel = `${subjectText}`;
  const dateLabel = `${dateText}`;

  return (
    <Container onClick={onRowClick} lastRow={isLastRow}>
      <IndexLabel> {rowIndex} </IndexLabel>
      <SubjectLabel> {subjectLabel} </SubjectLabel>
      {isProving ? (
        <IconsContainer>
          <StyledTrashIcon onClick={(e) => {
            e.stopPropagation();
            if (onDeleteClicked) {
              onDeleteClicked(); 
            }
          }} />
          <SpinnerContainer>
            <Spinner size={16}/>
          </SpinnerContainer>
        </IconsContainer>
      ) : isFailed ? (
        <IconsContainer>
          <StyledTrashIcon onClick={(e) => {
            e.stopPropagation();
            if (onDeleteClicked) {
              onDeleteClicked(); 
            }
          }} />

          <StyledXIcon/>
        </IconsContainer>
      ) : (
        // <DateLabel>{dateLabel}</DateLabel>
        <IconsContainer>
          <StyledDownloadIcon onClick={() => download(`${requestHistoryId}.json`, JSON.stringify(proof))} />
          <CheckContainer>
            <StyledCheck />
          </CheckContainer>
        </IconsContainer>
      )}
    </Container>
  );
};

const Container = styled.div<{ lastRow: boolean }>`
  display: grid;
  grid-template-columns: 0.1fr 1fr 0.4fr;
  grid-gap: 1px;
  padding: 1.1rem 1rem 1rem 1rem;
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

const IconsContainer = styled.div`
  display: flex;
  justify-content: flex-end;
  align-items: center;
  gap: 8px;
`;

const CheckContainer = styled.div`
  display: flex;
  justify-content: flex-end;
  align-items: center;
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

const StyledDownloadIcon = styled(Download)`
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
