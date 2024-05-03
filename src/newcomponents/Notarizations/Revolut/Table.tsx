import React, { ReactElement, useEffect, useState } from 'react';
import styled from 'styled-components';
import { Slash } from 'react-feather';
import { useDispatch } from 'react-redux';

import { ThemedText } from '@theme/text';
import { colors } from '@theme/colors';
import { NotarizationRow } from '@newcomponents/Notarizations/Row';
import { RevolutAction, RevolutActionType, RevolutRequest } from '@utils/types';
import { BackgroundActiontype, RequestHistory } from '@entries/Background/rpc';
import { deleteRequestHistory } from '@reducers/history';


const ROWS_PER_PAGE = 1;

type NotarizationRowData = {
  requestHistoryId: string;
  metadata: string;
  subject: string;
  date: string;
  isProving: boolean;
  isFailed: boolean;
  proof: { session: any; substrings: any };
};

type NotarizationTableProps = {
  action: RevolutActionType;
  notarizations: RequestHistory[];
};

export const NotarizationTable: React.FC<NotarizationTableProps> = ({
  action,
  notarizations,
}: NotarizationTableProps) => {
  const dispatch = useDispatch();

  /*
   * Context
   */

  // no-op

  /*
   * State
   */

  const [loadedNotarizations, setLoadedNotarizations] = useState<NotarizationRowData[]>([]);

  const [currentPage, setCurrentPage] = useState(0);

  /*
   * Handlers
   */

  const handleRowClick = (index: number) => {
    // no-op: view proof
  };

  const handleChangePage = (newPage: number) => {
    setCurrentPage(newPage);
  };

  const handleDeleteRequestHistoryClick = (requestHistoryId: string) => {
    dispatch(deleteRequestHistory(requestHistoryId));
  };

  /*
   * Helpers
   */

  function parseTimestamp(timestamp: string): string {
    const date = new Date(timestamp);
    const now = new Date();

    const isToday = date.getDate() === now.getDate() &&
                    date.getMonth() === now.getMonth() &&
                    date.getFullYear() === now.getFullYear();

    if (isToday) {
      return date.toLocaleTimeString('en-US', {
        hour: 'numeric',
        minute: '2-digit',
        hour12: true
      });
    } else {
      return date.toLocaleDateString('en-US', {
        month: 'numeric',
        day: 'numeric'
      });
    }
  };

  const totalPages = Math.ceil(loadedNotarizations.length / ROWS_PER_PAGE);

  const paginatedData = loadedNotarizations.slice(currentPage * ROWS_PER_PAGE, (currentPage + 1) * ROWS_PER_PAGE);

  const emptyNotarizationsCopy = (): string => {
    switch (action) {
      case RevolutAction.REGISTRATION:
      case RevolutAction.TRANSFER:
      default:
        return 'No stored proofs found. Follow the steps to generate a valid proof.';
    }
  };

  /*
   * Hooks
   */

  useEffect(() => {
    const loadingNotarizations = notarizations.map((notarization) => {

      let subject, metadata, timestamp = "";

      if (notarization.metadata) {
        switch (notarization.requestType) {
          case RevolutRequest.PAYMENT_PROFILE:
            const [notarizationTimestampProfile, revTag] = notarization.metadata;
    
            subject = `Proof of ${revTag}`;
            metadata = revTag;
            timestamp = notarizationTimestampProfile;
            break;
  
          case RevolutRequest.TRANSFER_DETAILS:
            const [notarizationTimestampTransfer, amount, currency, username] = notarization.metadata;
          
            const amountString = parseInt(amount) / 100 * -1;
            subject = `Sent ${amountString} ${currency} to ${username}`;
            metadata = amount;
            timestamp = notarizationTimestampTransfer;
            break;
  
          default:
            const [notarizationTimestampDefault] = notarization.metadata;
          
            subject = `Unrecognized (or outdated)`;
            metadata = '';
            timestamp = notarizationTimestampDefault;
            break;
        }
      }

      return {
        requestHistoryId: notarization.id,
        proof: notarization.proof,
        metadata: metadata,
        subject: subject,
        date: parseTimestamp(timestamp),
        isProving: notarization.status === 'pending',
        isFailed: notarization.status === 'error',
      } as NotarizationRowData;
    });

    setLoadedNotarizations(loadingNotarizations);
  }, [notarizations]);

  /*
   * Component
   */

  return (
    <Container>
      {loadedNotarizations.length === 0 ? (
        <EmptyNotarizationsContainer>
          <StyledSlash />

          <ThemedText.TableDescriptionSmall textAlign="center" lineHeight={1.3}>
            { emptyNotarizationsCopy() }
          </ThemedText.TableDescriptionSmall>
        </EmptyNotarizationsContainer>
      ) : (
        <Table>
          {paginatedData.map((notarization, index) => (
            <NotarizationRow
              key={index}
              subjectText={notarization.subject}
              requestHistoryId={notarization.requestHistoryId}
              proof={notarization.proof}
              dateText={notarization.date}
              isLastRow={index === loadedNotarizations.length - 1}
              onRowClick={() => handleRowClick(index)}
              rowIndex={index + 1 + currentPage * ROWS_PER_PAGE}
              isProving={notarization.isProving}
              isFailed={notarization.isFailed}
              onDeleteClicked={() => handleDeleteRequestHistoryClick(notarization.requestHistoryId)}
            />
          ))}
        </Table>
      )}

      {loadedNotarizations.length > ROWS_PER_PAGE && (
        <PaginationContainer>
          <PaginationButton
            disabled={currentPage === 0}
            onClick={() => handleChangePage(currentPage - 1)}
          >
            &#8249;
          </PaginationButton>
          <PageInfo>
            {false ? '0 of 0' : `${currentPage + 1} of ${totalPages}`}
          </PageInfo>
          <PaginationButton
            disabled={currentPage === totalPages - 1 || false}
            onClick={() => handleChangePage(currentPage + 1)}
          >
            &#8250;
          </PaginationButton>
        </PaginationContainer>
      )}
    </Container>
  )
};

const Container = styled.div`
  width: 100%;
  display: flex;
  flex-direction: column;
  align-self: flex-start;
  justify-content: center;
  border-radius: 8px;
  overflow: hidden;

  border: 1px solid ${colors.defaultBorderColor};
  border-radius: 8px;
  background-color: #090d14;
`;

const EmptyNotarizationsContainer = styled.div`
  display: flex;
  width: 100%;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  padding: 1.25rem 0rem;
  max-width: 75%;
  margin: auto;
  gap: 0.75rem;
  color: #ffffff;
`;

const Table = styled.div`
  width: 100%;
  box-shadow: 0px 2px 12px 0px rgba(0, 0, 0, 0.25);
  color: #616161;
`;

const StyledSlash = styled(Slash)`
  color: #fff;
  width: 24px;
  height: 24px;
`;

const PaginationContainer = styled.div`
  display: flex;
  justify-content: center;
  align-items: center;
  padding: 10px;
`;

const PaginationButton = styled.button`
  background-color: #131A2A;
  color: white;
  padding: 4px 12px;
  margin: 4px 16px;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  transition: background-color 0.3s;
  line-height: 1;
  font-size: 20px;

  &:hover {
    background-color: rgba(19, 26, 42, 0.75);
  }

  &:disabled {
    background-color: rgba(19, 26, 42, 0.5);
    cursor: not-allowed;
  }
`;

const PageInfo = styled.span`
  color: rgba(255, 255, 255, 0.8);
  word-spacing: 2px;
  font-size: 14px;
`;

export default NotarizationTable;
