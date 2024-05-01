import React, { ReactElement } from 'react';
import { useNavigate } from 'react-router';
import { UserPlus, FileText, Globe, DollarSign, Monitor } from 'react-feather';
import styled from 'styled-components';

import { useActiveTabUrl, useRequests } from '../../reducers/requests';
import revolut from '../../../utils/bookmark/revolut.json';

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
        return <StyledDollarSign />;

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

      <RevolutContainer>
        <RevolutTitle>
          <ThemedText.ModalHeadline textAlign="left">
            Revolut
          </ThemedText.ModalHeadline>
        </RevolutTitle>

        <ActionsGrid>
          {revolut.map((bm, i) => {
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
      </RevolutContainer>

      <ComingSoonContainer>
        <ComingSoonTitle>
          <ThemedText.ModalHeadline textAlign="left">
            Coming Soon!
          </ThemedText.ModalHeadline>
        </ComingSoonTitle>

        <ComingSoonDescription>
          <ThemedText.SubHeaderSmall textAlign="left">
            More markets are coming soon. Let us know what platforms you would like to see supported in ZKP2P!
          </ThemedText.SubHeaderSmall>
        </ComingSoonDescription>

        <ComingSoonGrid>
          <ComingSoonCard
            onClick={() => window.open('https://forms.gle/UG699TVHmbdN9jN36', '_blank')}
          >
            <StyledFileText />

            <ActionTitle>
              Tickets
            </ActionTitle>
          </ComingSoonCard>
          <ComingSoonCard
            onClick={() => window.open('https://forms.gle/UG699TVHmbdN9jN36', '_blank')}
          >
            <StyledDollarSign />

            <ActionTitle>
              UPI
            </ActionTitle>
          </ComingSoonCard>
          <ComingSoonCard
            onClick={() => window.open('https://forms.gle/UG699TVHmbdN9jN36', '_blank')}
          >
            <StyledGlobe />

            <ActionTitle>
              Domains
            </ActionTitle>
          </ComingSoonCard>
          <ComingSoonCard
            onClick={() => window.open('https://forms.gle/UG699TVHmbdN9jN36', '_blank')}
          >
            <StyledMonitor />

            <ActionTitle>
              Gaming
            </ActionTitle>
          </ComingSoonCard>
        </ComingSoonGrid>
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

const RevolutContainer = styled.div`
  display: flex;
  flex-direction: column;
  padding: 1rem;
  margin: 0rem 0.5rem;
  gap: 0.75rem;
`;

// border-radius: 12px;
// border: 1px solid ${colors.defaultBorderColor};

const RevolutTitle = styled.div`
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

const StyledDollarSign = styled(DollarSign)`
  color: ${colors.white};
  width: 20px;
  height: 20px;
`;

const StyledMonitor = styled(Monitor)`
  color: ${colors.white};
  width: 20px;
  height: 20px;
`;

const StyledGlobe = styled(Globe)`
  color: ${colors.white};
  width: 20px;
  height: 20px;
`;

const StyledFileText = styled(FileText)`
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

const ComingSoonGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(80px, 1fr));
  gap: 0.5rem;
`;

const ComingSoonCard = styled.div`
  display: flex;
  flex-direction: column;
  justify-content: flex-start;
  align-items: center;

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

const ComingSoonTitle = styled.div`
  padding-left: 0.75rem;
  color: ${colors.white};
  display: flex;
  align-items: center;
`;

const ComingSoonDescription = styled.div`
  padding-left: 0.75rem;
  color: ${colors.white};
`;