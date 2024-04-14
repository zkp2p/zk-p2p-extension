import React, { ReactElement, useEffect, useState } from 'react';
import styled from 'styled-components';
import { UserX } from 'react-feather';

import { ThemedText } from '@theme/text';
import { colors } from '@theme/colors';
import { RequestRow } from '@newcomponents/Requests/Row';
import { WiseAction, WiseActionType } from '@utils/types';
import { BackgroundActiontype, RequestLog } from '../../entries/Background/rpc';


const ROWS_PER_PAGE = 2;

type RequestRowData = {
  subject: string;
  date: string;
};

type RequestTableProps = {
  action: WiseActionType;
  requests: RequestLog[];
  setSelectedIndex: (index: number | null) => void;
  selectedIndex: number | null;
};

export const RequestTable: React.FC<RequestTableProps> = ({
  action,
  requests,
  setSelectedIndex,
  selectedIndex,
}: RequestTableProps) => {
  /*
   * State
   */

  const [loadedRequests, setLoadedRequests] = useState<RequestRowData[]>([]);

  const [currentPage, setCurrentPage] = useState(0);

  /*
   * Handlers
   */

  const handleChangePage = (newPage: number) => {
    setCurrentPage(newPage);
  };

  const handleRowClick = (index: number) => {
    const globalIndex = index + currentPage * ROWS_PER_PAGE;

    setSelectedIndex(globalIndex);
  };

  /*
   * Helpers
   */

  function parseTimestamp(timestamp: number): string {
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
      console.log('Request: ', request);

      return {
        subject: request.requestId,
        date: parseTimestamp(request.timestamp),
      } as RequestRowData;
    });

    setLoadedRequests(newRequests);
  }, [requests]);

  /*
   * Helpers
   */

  const emptyRequestCopy = (): string => {
    switch (action) {
      case WiseAction.REGISTRATION:
        return 'No Wise tags found. Navigate to the Payments page on Wise to load your tag.';

      case WiseAction.DEPOSITOR_REGISTRATION:
        return 'No past payments found. Navigate to any past outgoing transfer to load requests.';

      case WiseAction.TRANSFER:
      default:
        return 'No payment found. Navigate to the transaction page for this order to load request.';
    }
  };

  /*
   * Component
   */

  return (
    <Container>
      {requests.length === 0 ? (
        <EmptyRequestsContainer>
          <StyledUserX />

          <ThemedText.TableDescriptionSmall textAlign="center" lineHeight={1.3}>
            { emptyRequestCopy() }
          </ThemedText.TableDescriptionSmall>
        </EmptyRequestsContainer>
      ) : (
        <Table>
          {paginatedData.map((notarization, index) => (
            <RequestRow
              key={index}
              subjectText={notarization.subject}
              dateText={notarization.date}
              isSelected={selectedIndex === (index + currentPage * ROWS_PER_PAGE)}
              isLastRow={index === loadedRequests.length - 1}
              onRowClick={() => handleRowClick(index)}
              rowIndex={index + 1 + currentPage * ROWS_PER_PAGE}
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

const EmptyRequestsContainer = styled.div`
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
  box-shadow: 0px 2px 12px 0px rgba(0, 0, 0, 0.25);
  color: #616161;
`;

const StyledUserX = styled(UserX)`
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
  margin: 0 16px;
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

export default RequestTable;
