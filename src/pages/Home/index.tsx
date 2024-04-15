import React, { ReactElement } from 'react';
import { useNavigate } from 'react-router';
import { UserPlus, Pocket, DollarSign } from 'react-feather';
import styled from 'styled-components';

import { useActiveTabUrl, useRequests } from '../../reducers/requests';
import bookmarks from '../../../utils/bookmark/bookmarks.json';

import { colors } from '@theme/colors';
import { ThemedText } from '@theme/text';


export default function Home(): ReactElement {
  const navigate = useNavigate();

  const requests = useRequests();
  const url = useActiveTabUrl();

  /*
   * Handlers
   */

  const handleBookmarkPressedForIndex = (index: number) => {
    switch (index) {
      case 0:
        return navigate(`/registration`);

      case 1:
        return navigate(`/deposit`);

      case 2:
      default:
        return navigate(`/onramp`);
    }
  };

  /*
   * Helpers
   */

  const iconForIndex = (index: number) => {
    switch (index) {
      case 0:
        return <StyledUser />;

      case 1:
        return <StyledPocket />;

      case 2:
      default:
        return <StyledDollarSign />;
    }
  };

  /*
   * Component
   */

  return (
    <PageWrapper>
      <IntroductionContainer>
        <IntroductionTitle>
          Welcome to ZKP2P
        </IntroductionTitle>
        
        <IntroductionDescription>
          This extension is meant to be used with the client: zkp2p.xyz
        </IntroductionDescription>
      </IntroductionContainer>

        {/* <NavButton fa="fa-solid fa-table" onClick={() => navigate('/requests')}>
          <span>Requests</span>
          <span>{`(${requests.length})`}</span>
        </NavButton>
        <NavButton fa="fa-solid fa-magnifying-glass" onClick={() => navigate('/custom')}>
          Custom
        </NavButton>
        <NavButton fa="fa-solid fa-magnifying-glass" onClick={() => navigate('/verify')}>
          Verify
        </NavButton>
        <NavButton fa="fa-solid fa-list" onClick={() => navigate('/history')}>
          History
        </NavButton>
        <NavButton fa="fa-solid fa-gear" onClick={() => navigate('/options')}>
          Options
        </NavButton> */}

      <WiseContainer>
        <WiseTitle>
          <ThemedText.ModalHeadline textAlign="left">
            Wise
          </ThemedText.ModalHeadline>
        </WiseTitle>

        <ActionsGrid>
          {bookmarks.map((bm, i) => {
            return (
              <ActionCard
                key={i}
                onClick={() => {
                  handleBookmarkPressedForIndex(i)
                }}
              >
                {iconForIndex(i)}

                <ActionTitle>
                  {bm.title}
                </ActionTitle>
              </ActionCard>
            );
          })}
        </ActionsGrid>
      </WiseContainer>

      <ComingSoonContainer>
        <WiseTitle>
          <ThemedText.ModalHeadline textAlign="left">
            Coming Soon
          </ThemedText.ModalHeadline>
        </WiseTitle>

        <ComingSoonDescription>
          <ThemedText.SubHeaderSmall textAlign="left">
              Some copy about some really cool things coming soon to look forward to in future updates
          </ThemedText.SubHeaderSmall>
        </ComingSoonDescription>
      </ComingSoonContainer>
    </PageWrapper>
  );
}

const PageWrapper = styled.div`
  display: flex;
  flex-direction: column;
  gap: 1rem;
`;

const IntroductionContainer = styled.div`
  display: flex;
  flex-direction: column;
  padding: 0rem 2rem;
  gap: 0.5rem;
  text-align: center;
  color: ${colors.white};
`;

const IntroductionTitle = styled.div`
  text-align: left;
  font-size: 18px;
  font-weight: 600;
`;

const IntroductionDescription = styled.div`
  text-align: left;
  font-size: 15px;
`;

const WiseContainer = styled.div`
  display: flex;
  flex-direction: column;
  padding: 1rem;
  margin: 0rem 0.5rem;
  gap: 0.75rem;
`;

// border-radius: 12px;
// border: 1px solid ${colors.defaultBorderColor};

const WiseTitle = styled.div`
  padding-left: 0.75rem;
  color: ${colors.white};
`;

const ActionsGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(120px, 1fr));
  gap: 0.5rem;
`;

const ActionCard = styled.div`
  display: flex;
  flex-direction: column;
  justify-content: flex-start;
  align-items: flex-start;

  flex-wrap: nowrap;
  border-radius: 12px;
  padding: 1rem 1.25rem;
  gap: 0.75rem;
  background-color: ${colors.selectorColor};

  &:hover {
    background-color: ${colors.selectorHover};
    cursor: pointer;
  }
`;

const StyledUser = styled(UserPlus)`
  color: ${colors.white};
  width: 20px;
  height: 20px;
`;

const StyledPocket = styled(Pocket)`
  color: ${colors.white};
  width: 20px;
  height: 20px;
`;

const StyledDollarSign = styled(DollarSign)`
  color: ${colors.white};
  width: 20px;
  height: 20px;
`;

const ActionTitle = styled.div`
  font-size: 15px;
  font-weight: 600;
  color: ${colors.white};
`;

const ComingSoonContainer = styled.div`
  display: flex;
  flex-direction: column;
  padding: 1rem;
  margin: 0rem 0.5rem;
  gap: 0.75rem;
`;

const ComingSoonDescription = styled.div`
  padding-left: 0.75rem;
  color: ${colors.white};
`;