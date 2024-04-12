import React, { ReactElement, useEffect, useState } from 'react';
import styled from 'styled-components';
import { Slash } from 'react-feather';

import { ThemedText } from '@theme/text';
import { colors } from '@theme/colors';
import { RequestRow } from '@newcomponents/Notarizations/Row';
import { BackgroundActiontype, RequestHistory } from '../../entries/Background/rpc';


const ROWS_PER_PAGE = 2;

type RequestRowData = {
  metadata: string;
  subject: string;
  date: string;
  isProving: boolean;
};

type Props = {
  requests: RequestHistory[];
};

export default function RequestTable(props: Props): ReactElement {
  const { requests } = props;

  /*
   * Context
   */

  // no-op

  /*
   * State
   */

  const [loadedRequests, setLoadedRequests] = useState<RequestRowData[]>([]);

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

  const totalPages = Math.ceil(loadedRequests.length / ROWS_PER_PAGE);

  const paginatedData = loadedRequests.slice(currentPage * ROWS_PER_PAGE, (currentPage + 1) * ROWS_PER_PAGE);

  /*
   * Hooks
   */

  useEffect(() => {
    const newRequests = requests.map((request) => {
      console.log('Request: ', request.url);
      
      let subject, metadata, timestamp = "";
      switch (request.url) {
        case 'https://wise.com/gateway/v1/payments':
          const [requestTimestamp, wiseTag] = request.metadata;
          const wiseTagStripped = wiseTag.split('@')[1];

          subject = `${wiseTag}`;
          metadata = wiseTagStripped;
          timestamp = requestTimestamp;
          break;

        default:
          const [requestTimestamp, amount, currency] = request.metadata;
          
          subject = `Sent €${amount} ${currency}`;
          metadata = amount;
          timestamp = requestTimestamp;
          break;
      }

      return {
        metadata: metadata,
        subject: subject,
        date: parseTimestamp(timestamp)
        isProving: request.status === 'pending',
      } as RequestRowData;
    });

    setLoadedRequests(newRequests);
  }, [requests]);

  /*
   * Component
   */

  return (
    <Container>
      <TableContainer>
        {requests.length === 0 ? (
          <EmptyNotarizationsContainer>
            <StyledSlash />

            <ThemedText.SubHeaderSmall textAlign="center" lineHeight={1.3}>
              No proofs stored. Notarize one of the requests above to generate a valid proof.
            </ThemedText.SubHeaderSmall>
          </EmptyNotarizationsContainer>
        ) : (
          <Table>
            {paginatedData.map((notarization, index) => (
              <RequestRow
                key={index}
                subjectText={notarization.subject}
                dateText={notarization.date}
                isLastRow={index === loadedRequests.length - 1}
                onRowClick={() => handleRowClick(index)}
                rowIndex={index + 1 + currentPage * ROWS_PER_PAGE}
                isProving={notarization.isProving}
              />
            ))}
          </Table>
        )}

        {loadedRequests.length > ROWS_PER_PAGE && (
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
      </TableContainer>
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
  gap: 1rem;
`;

const EmptyNotarizationsContainer = styled.div`
  display: flex;
  width: 100%;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  padding: 1.9rem 0rem;
  max-width: 75%;
  margin: auto;
  gap: 1rem;
  color: #ffffff;
`;

const TableContainer = styled.div`
  border: 1px solid ${colors.defaultBorderColor};
  border-radius: 8px;
  background-color: #090d14;
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
  padding: 8px;
`;

const PaginationButton = styled.button`
  background-color: rgba(0, 0, 0, 0.5);
  color: white;
  padding: 8px 16px;
  margin: 0 16px;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  transition: background-color 0.3s;
  &:hover {
    background-color: rgba(0, 0, 0, 0.8);
  }
  &:disabled {
    background-color: rgba(0, 0, 0, 0.2);
    cursor: not-allowed;
  }
`;

const PageInfo = styled.span`
  color: rgba(255, 255, 255, 0.8);
  word-spacing: 2px;
  font-size: 14px;
`;