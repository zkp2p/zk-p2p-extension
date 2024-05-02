import React, { ReactElement } from 'react';
import { useNavigate } from 'react-router';
import { UserPlus, DollarSign } from 'react-feather';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faStore } from '@fortawesome/free-solid-svg-icons';
import styled from 'styled-components';

import { Button } from '@newcomponents/common/Button';
import { useActiveTabUrl, useRequests } from '@reducers/requests';
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

  const handleReturnToTab = async () => {
    chrome.tabs.create({ url: 'https://zkp2p.xyz' });
  };

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
        <IntroductionTextContainer>
          <IntroductionTitle>
            Welcome to ZKP2P
          </IntroductionTitle>
          
          <IntroductionDescription>
            This browser assistant is meant to be used on zkp2p.xyz with Revolut
          </IntroductionDescription>
        </IntroductionTextContainer>

        <ButtonContainer>
          <Button
            onClick={() => handleReturnToTab()}
            width={164}
            height={40}
            fontSize={14}
          >
            Go to zkp2p.xyz
          </Button>
        </ButtonContainer>
      </IntroductionContainer>

      <IntegrationsContainer>
        <TitleContainer>
          <IntroductionTitle>
            Integrations
          </IntroductionTitle>
        </TitleContainer>

        <RevolutContainer>
          <ThemedText.TableHeaderSmall textAlign="left">
              Revolut
          </ThemedText.TableHeaderSmall>

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
      </IntegrationsContainer>

      <ComingSoonContainer>
        <TitleContainer>
          <ThemedText.ModalHeadline textAlign="left">
            Coming Soon
          </ThemedText.ModalHeadline>
        </TitleContainer>

        <ComingSoongBodyContainer
          onClick={() => {
            chrome.tabs.create({ url: 'https://t.me/+XDj9FNnW-xs5ODNl' });
          }}
          >
          <FontAwesomeIcon
            icon={faStore}
            style={{ color: colors.white, width: '28px', height: '28px'}}
          />

          <ThemedText.TableDescriptionSmall textAlign="center" lineHeight={1.3}>
            Have ideas for other assets you would like to see supported by ZKP2P?<br/>Let us know!
          </ThemedText.TableDescriptionSmall>
        </ComingSoongBodyContainer>
      </ComingSoonContainer>
    </PageWrapper>
  );
}

const PageWrapper = styled.div`
  display: grid;
  grid-template-rows: .8fr 1fr 1fr;
  min-height: 100vh;
  grid-template-areas:
    "intro"
    "integrations"
    "comingSoon";

  padding-bottom: 4rem;
`;

const IntroductionContainer = styled.div`
  grid-area: intro;
  display: flex;
  flex-direction: column;
  padding: 1rem 2rem;
  gap: 0.75rem;
  text-align: center;
  color: ${colors.white};
`;

const IntroductionTextContainer = styled.div`
  display: flex;
  flex-direction: column;
  justify-content: flex-start;
  gap: 0.25rem;
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

const IntegrationsContainer = styled.div`
  grid-area: integrations;
  display: flex;
  flex-direction: column;
  padding: 1rem;
  margin: 0rem 0.5rem;
  gap: 0.75rem;
`;

const TitleContainer = styled.div`
  padding-left: 0.75rem;
  color: ${colors.white};
`;

const RevolutContainer = styled.div`
  display: flex;
  flex-direction: column;
  padding-left: 0.75rem;
  color: ${colors.white};
  gap: 0.75rem;
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

const ActionTitle = styled.div`
  font-size: 15px;
  font-weight: 600;
  color: ${colors.white};
`;

const ComingSoonContainer = styled.div`
  grid-area: comingSoon;
  display: flex;
  flex-direction: column;
  padding: 1rem;
  margin: 0rem 0.5rem;
  gap: 0.75rem;
`;

const ComingSoongBodyContainer = styled.div`
  display: flex;
  width: 100%;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  padding: 1.25rem 2rem;
  margin: 0rem 0.5rem;
  gap: 0.75rem;
  border-radius: 16px;
  background-color: ${colors.selectorColor};

  color: #ffffff;

  &:hover {
    background-color: ${colors.selectorHover};
    cursor: pointer;
  }
`;

const ButtonContainer = styled.div`
  display: flex;
  justify-content: center;
  align-items: center;
`;
