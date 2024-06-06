import React, { ReactElement } from 'react';
import { useNavigate } from 'react-router';
import { UserPlus, DollarSign } from 'react-feather';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faStore } from '@fortawesome/free-solid-svg-icons';
import styled from 'styled-components';

import { Button } from '@components/common/Button';
import { useActiveTabUrl, useRequests } from '@reducers/requests';
import revolutBookmarks from '../../../utils/bookmark/revolut.json';

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
            Welcome to ZKP2P Peer
          </IntroductionTitle>
          
          <IntroductionDescription>
            This browser assistant is meant to be used with zkp2p.xyz
          </IntroductionDescription>
        </IntroductionTextContainer>

        <ButtonContainer>
          <Button
            onClick={() => handleReturnToTab()}
            width={164}
            height={40}
            fontSize={14}
          >
            Go to ZKP2P
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
          <ThemedText.TableHeaderSmall textAlign="left" paddingLeft={"0.5rem"}>
              Revolut
          </ThemedText.TableHeaderSmall>

          <ActionsGrid>
            {revolutBookmarks.map((bookmark, index) => {
              return (
                <ActionCard
                  key={index}
                  onClick={() => {
                    handleBookmarkPressedForIndex(index)
                  }}
                >
                  {iconForIndex(index)}

                  <ActionTitle>
                    {bookmark.title}
                  </ActionTitle>

                  <ActionSubtitle>
                    {bookmark.description}
                  </ActionSubtitle>
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

        <ComingSoonBodyContainer
          onClick={() => {
            chrome.tabs.create({ url: 'https://t.me/+XDj9FNnW-xs5ODNl' });
          }}
          >
          <FontAwesomeIcon
            icon={faStore}
            style={{ color: colors.white, width: '28px', height: '28px'}}
          />

          <ThemedText.SubHeaderSmall textAlign="center" lineHeight={1.3}>
            Have ideas for other assets you would like to see on ZKP2P?<br/>Let us know!
          </ThemedText.SubHeaderSmall>
        </ComingSoonBodyContainer>
      </ComingSoonContainer>
    </PageWrapper>
  );
}

const PageWrapper = styled.div`
  display: flex;
  flex-direction: column;
  width: 100%;
  min-height: calc(100vh - 76px);
  height: calc(100vh - 76px);
  overflow: auto;
  padding: 0 1.5rem 1rem;
  box-sizing: border-box;
`;

const IntroductionContainer = styled.div`
  display: flex;
  max-height: 160px;
  flex-direction: column;
  padding: 0rem 0.5rem 1rem 0.5rem;
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
  display: flex;
  max-height: 196px;
  flex-direction: column;
  padding: 1rem 0;
  gap: 0.75rem;
`;

const TitleContainer = styled.div`
  padding-left: 0.5rem;
  color: ${colors.white};
`;

const RevolutContainer = styled.div`
  display: flex;
  flex-direction: column;
  color: ${colors.white};
  gap: 0.75rem;
`;

const ActionsGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(120px, 1fr));
  gap: 0.75rem;
`;

const ActionCard = styled.div`
  display: flex;
  flex-direction: column;
  justify-content: flex-start;
  align-items: flex-start;

  flex-wrap: nowrap;
  border-radius: 12px;
  padding: 1rem 1.25rem;
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
  padding-top: 1rem;
  font-size: 14px;
  font-weight: 600;
  color: ${colors.titleColor};
`;

const ActionSubtitle = styled.div`
  font-size: 13px;
  color: ${colors.subtitleColor};
`;

const ComingSoonContainer = styled.div`
  display: flex;
  flex-direction: column;
  padding: 1rem 0;
  gap: 0.75rem;
  flex-grow: 1;
  overflow: hidden;
  min-height: 200px;
`;

const ComingSoonBodyContainer = styled.div`
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  padding: 1.25rem 2rem;
  gap: 0.75rem;
  border-radius: 16px;
  background-color: ${colors.selectorColor};
  color: #ffffff;

  &:hover {
    background-color: ${colors.selectorHover};
    cursor: pointer;
  }

  flex-grow: 1;
`;

const ButtonContainer = styled.div`
  display: flex;
  justify-content: center;
  align-items: center;
`;
