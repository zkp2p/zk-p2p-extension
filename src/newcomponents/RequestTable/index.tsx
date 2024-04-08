import React, { useEffect, useState } from 'react';
import styled, { css } from 'styled-components';
import { Zap, UserX, UserCheck } from 'react-feather';

import { ThemedText } from '../../theme/text';
import { colors } from '../../theme/colors';
import { Button } from '../../newcomponents/common/Button';
import { NotarizationRow } from './NotarizationRow';


const ROWS_PER_PAGE = 3;

export const RequestTable: React.FC = () => {
  /*
   * Context
   */

  // no-op

  /*
   * State
   */

  const [loadedNotaryProofs, setLoadedNotaryProofs] = useState<string[]>([]);

  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);

  const [ctaButtonTitle, setCtaButtonTitle] = useState<string>('');

  const [isShowingTable, setIsShowingTable] = useState<boolean>(false);

  const [currentPage, setCurrentPage] = useState(0);

  /*
   * Handlers
   */

  const handleRowClick = (index: number) => {
    // no-op
  };

  const handleToggleNotarizationTablePressed = () => {
    setIsShowingTable(!isShowingTable);
  };

  const handleChangePage = (newPage: number) => {
    setCurrentPage(newPage);
  };

  /*
   * Helpers
   */

  const noNotarizationsErrorString = () => {
    return 'No notarizations found';
  };

  function formatDateTime(unixTimestamp: string): string {
    const date = new Date(Number(unixTimestamp));
    const now = new Date();

    const isToday =
      date.getDate() === now.getDate() &&
      date.getMonth() === now.getMonth() &&
      date.getFullYear() === now.getFullYear();

    if (isToday) {
      return date.toLocaleTimeString('en-US', {
        hour: 'numeric',
        minute: '2-digit',
        hour12: true,
      });
    } else {
      return date.toLocaleDateString('en-US', {
        month: 'numeric',
        day: 'numeric',
      });
    }
  }

  const totalPages = 1; // Math.ceil(loadedNotaryProofs.length / ROWS_PER_PAGE);

  const paginatedData = []; // loadedNotaryProofs.slice(currentPage * ROWS_PER_PAGE, (currentPage + 1) * ROWS_PER_PAGE);

  async function fetchData() {
    // refetchProfileRequests();
  };

  /*
   * Hooks
   */

  // no-op

  /*
   * Component
   */

  return (
    <Container>
      <ExtensionDetectedContainer>
        <TitleAndTableContainer>
          <TitleAndOAuthContainer>
            <NotarizationsTitleContainer>
              <TitleLabel>Loaded Wise Requests</TitleLabel>
            </NotarizationsTitleContainer>
          </TitleAndOAuthContainer>

          {[].length === 0 ? (
            <EmptyNotarizationsContainer>
              <StyledUserX />

              <ThemedText.SubHeaderSmall textAlign="center" lineHeight={1.3}>
                Test
              </ThemedText.SubHeaderSmall>
            </EmptyNotarizationsContainer>
          ) : (
            <Table>
              {paginatedData.map((notarization, index) => (
                <NotarizationRow
                  key={index}
                  subjectText={'Subject'}
                  dateText={'Data'}
                  isSelected={index === selectedIndex}
                  isLastRow={index === loadedNotaryProofs.length - 1}
                  onRowClick={() => handleRowClick(index)}
                  rowIndex={index + 1 + currentPage * ROWS_PER_PAGE}
                />
              ))}
            </Table>
          )}

          {loadedNotaryProofs.length > ROWS_PER_PAGE && (
            <PaginationContainer>
              <PaginationButton
                disabled={currentPage === 0}
                onClick={() => handleChangePage(currentPage - 1)}
              >
                &#8249;
              </PaginationButton>
              <PageInfo>
                {totalPages === 0 ? '0 of 0' : `${currentPage + 1} of ${totalPages}`}
              </PageInfo>
              <PaginationButton
                disabled={currentPage === totalPages - 1 || totalPages === 0}
                onClick={() => handleChangePage(currentPage + 1)}
              >
                &#8250;
              </PaginationButton>
            </PaginationContainer>
          )}
        </TitleAndTableContainer>

        <ButtonContainer>
          <Button
            disabled={false}
            onClick={() => {}}
          >
            Lets Go!
          </Button>
        </ButtonContainer>
      </ExtensionDetectedContainer>
    </Container>
  )
};

const Container = styled.div`
  width: 100%;
  display: flex;
  flex-direction: column;
  align-self: flex-start;
  justify-content: center;

  background-color: ${colors.container};
  border: 1px solid ${colors.defaultBorderColor};
  border-radius: 16px;
  overflow: hidden;
`;

const ExtensionDetectedContainer = styled.div`
  display: flex;
  flex-direction: column;
  gap: 1rem;
  padding: 1.5rem;
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
`;

const TitleAndTableContainer = styled.div`
  border: 1px solid ${colors.defaultBorderColor};
  border-radius: 8px;
  background-color: #090d14;
`;

const TitleAndOAuthContainer = styled.div`
  display: flex;
  flex-direction: row;
  justify-content: space-between;
  align-items: center;
  border-bottom: 1px solid ${colors.defaultBorderColor};
  padding: 1rem 1.5rem;
`;

const NotarizationsTitleContainer = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
`;

const TitleLabel = styled.label`
  display: flex;
  font-size: 14px;
  color: #6c757d;
  align-items: center;
`;

const Table = styled.div`
  width: 100%;
  box-shadow: 0px 2px 12px 0px rgba(0, 0, 0, 0.25);
  color: #616161;
`;

const ButtonContainer = styled.div`
  display: grid;
  padding-top: 1rem;
`;

const StyledUserX = styled(UserX)`
  color: #fff;
  width: 28px;
  height: 28px;
`;

const StyledUserCheck = styled(UserCheck)`
  color: #fff;
  width: 28px;
  height: 28px;
`;

const TableToggleLink = styled.button`
  width: 100%;
  font-size: 15px;
  font-family: 'Graphik';
  color: #ffffff;
  opacity: 0.3;
  text-align: center;
  background: none;
  border: none;
  cursor: pointer;
  text-decoration: underline;
  display: inline;
`;

const PaginationContainer = styled.div`
  display: flex;
  justify-content: center;
  align-items: center;
  padding: 12px;
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
  font-size: 16px;
`;

const TagDetectionContainer = styled.div`
  display: flex;
  flex-direction: column;
  background-color: #0a0d14;

  border: 1px solid ${colors.defaultBorderColor};
  border-radius: 8px;
`;

const TagDetectionIconAndCopyContainer = styled.div`
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  padding: 2rem 1rem;
  gap: 1rem;

  border-radius: 8px;
`;
