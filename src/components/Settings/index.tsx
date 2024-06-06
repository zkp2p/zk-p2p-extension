import React, { useEffect, useRef, useReducer, useState } from 'react';
import { Settings as SettingsIcon, Circle, Wifi, Repeat } from 'react-feather';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router';
import styled from 'styled-components';

import { NotaryConfiguration } from '@hooks/useFetchNotaryList';
import { useOnClickOutside } from '@hooks/useOnClickOutside';
import { colors } from '@theme/colors';
import { SVGIconThemed } from '@components/SVGIcon/SVGIconThemed';
import { Overlay } from '@components/common/Overlay';
import { AppDispatch } from '@utils/store';
import { StatusColors, StatusColorsType } from '@utils/types';
import { AppRootState } from '@reducers/index';
import { fetchApiUrls } from '@reducers/settings';


const CLIENT_VERSION = '0.0.8';

interface StyledCircleProps {
  connection: StatusColorsType | null;
}

interface SettingsDropdownProps {
  notaryList: NotaryConfiguration[] | null;
}

export const SettingsDropdown: React.FC<SettingsDropdownProps> = ({
  notaryList
}) => {
  const [isOpen, toggleOpen] = useReducer((s) => !s, false)

  const ref = useRef<HTMLDivElement>(null)
  useOnClickOutside(ref, isOpen ? toggleOpen : undefined)
  const navigate = useNavigate();
  const dispatch = useDispatch<AppDispatch>();

  const { latencies, notary } = useSelector((state: AppRootState) => state.settings);
  
  /*
   * State
   */
  const [notaryName, setNotaryName] = useState<string | null>(null);
  const [status, setStatus] = useState<StatusColorsType | null>(null);

  /* 
   * Hooks
   */
  useEffect(() => {
    dispatch(fetchApiUrls());

    if (notary && notaryList) {
      const fetchNotaryName = notaryList.find(config => config.notary === notary);

      if (fetchNotaryName) {
        setNotaryName(fetchNotaryName.name);
      }
    }
  }, [dispatch, notaryName, notary, notaryList]);
  
  useEffect(() => {
    if (latencies && latencies[notary]) {
      const currentLatencyInt = parseInt(latencies[notary]);
      if (currentLatencyInt > 160) {
        setStatus(StatusColors.RED);
      } else if (currentLatencyInt > 100) {
        setStatus(StatusColors.YELLOW);
      } else {
        setStatus(StatusColors.GREEN);
      }
    }
  }, [latencies, notary]);

  /*
   * Handler
   */

  const handleOverlayClick = () => {
    toggleOpen();
  };

  const jumpToMedia = (url: string) => {
    window.open(url, '_blank');
  };
  
  const handleUpdateNotaryClick = () => {
    toggleOpen();
    navigate('/settings');
  };

  /*
   * Component
   */

  return (
    <Wrapper ref={ref}>
      <NavButton onClick={toggleOpen}>
        <StyledSettings />
      </NavButton>

      {isOpen && (
        <DropdownAndOverlayContainer>
          <Overlay onClick={handleOverlayClick} />

          <DropdownContainer>
            <TitleContainer>
              Settings
            </TitleContainer>

            <DropdownItemsContainer>
              <DropdownItemWithValueContainer>
                <DropdownItemHeaderTitle>
                  <StyledWifi />

                  <StackedTitleWithValue onClick={handleUpdateNotaryClick}>
                    <DropdownItem>
                      Notary
                    </DropdownItem>

                    <NotaryNameContainer>
                      {notaryName}
                    </NotaryNameContainer>
                  </StackedTitleWithValue>
                </DropdownItemHeaderTitle>

                <StyledCircle connection={status} />
              </DropdownItemWithValueContainer>

              <ItemAndIconContainer onClick={() => window.open('https://zkp2p.xyz/', '_blank')}>
                <StyledRepeat />
                <DropdownItem>
                  App ↗
                </DropdownItem>
              </ItemAndIconContainer>
            </DropdownItemsContainer>

            <IconRowContainer>
              <Icon
                icon={'twitter'}
                onClick={() => jumpToMedia('https://twitter.com/zkp2p')}
              />
              <Icon
                icon={'github'}
                onClick={() => jumpToMedia('https://github.com/zkp2p')}
              />
              <Icon
                icon={'telegram'}
                onClick={() => jumpToMedia('https://t.me/+XDj9FNnW-xs5ODNl')}
              />
              <VersionLabel>
                v{CLIENT_VERSION}
              </VersionLabel>
            </IconRowContainer>
          </DropdownContainer>
        </DropdownAndOverlayContainer>
      )}
    </Wrapper>
  )
};

const Wrapper = styled.div`
  display: flex;
  flex-direction: column;
  position: relative;
  align-items: flex-start;
`;

const StyledSettings = styled(SettingsIcon)`
  color: #FFF;
  width: 20px;
  height: 20px;
`;

const NavButton = styled.div`
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 10;
  padding-right: 8px;
`;

const DropdownAndOverlayContainer = styled.div`

`;

const DropdownContainer = styled.div`
  display: flex;
  flex-direction: column;
  width: 176px;
  border-radius: 12px;
  border: 1px solid rgba(255, 255, 255, 0.2);
  padding: 1rem 1.25rem;
  background: #1B1B1B;
  position: absolute;
  top: calc(100% + 20px);
  right: 0;
  z-index: 20;
  color: #FFFFFF;
`;

const TitleContainer = styled.div`
  font-size: 15px;
  font-weight: 600;
  text-align: left;
`;

const IconRowContainer = styled.div`
  display: flex;
  flex-direction: row;
  gap: 1rem;
  padding-top: 1rem;
  align-items: center;
`;

const Icon = styled(SVGIconThemed)`
  width: 16px;
  height: 16px;
  cursor: pointer;
  transition: opacity 0.2s ease-in-out;

  &:hover {
    opacity: 0.6;
  }
`;

const DropdownItemsContainer = styled.div`
  display: flex;
  flex-direction: column;
  white-space: nowrap;
  text-align: left;
  padding-top: 1rem;
  font-size: 14px;
  font-weight: 600;
  text-decoration: none;
  gap: 0.25rem;
  cursor: pointer;
  line-height: 1;
`;

const StyledWifi = styled(Wifi)`
  color: ${colors.white};
  height: 16px;
  width: 16px;
`;

const StyledRepeat = styled(Repeat)`
  color: ${colors.white};
  height: 16px;
  width: 16px;
`;

const DropdownItemWithValueContainer = styled.div`
  display: flex;  
  justify-content: space-between;
  gap: 0.5rem;
  align-items: center;

  &:hover {
    color: #6C757D;
    box-shadow: none;
    ${StyledWifi} {
      color: #6C757D;
    }
  }
`;

const DropdownItemHeaderTitle = styled.div`
  display: flex;  
  justify-content: space-between;
  align-items: center;
  gap: 0.5rem;
`;

const StackedTitleWithValue = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
`;

const NotaryNameContainer = styled.div`
  display: flex;
  flex-direction: row;
  align-items: center;
  justify-content: space-between;

  font-size: 13px;
  color: #6C757D;
`;

const StyledCircle = styled(Circle)<StyledCircleProps>`
  height: 8px;
  width: 8px;

  fill: ${({ connection }) => {
    switch (connection) {
      case StatusColors.GREEN:
        return colors.successGreen;
      case StatusColors.YELLOW:
        return "yellow";
      case StatusColors.RED:
        return colors.warningRed;
      default:
        return colors.successGreen;
    }
  }};

  color: ${({ connection }) => {
    switch (connection) {
      case StatusColors.GREEN:
        return colors.successGreen;
      case StatusColors.YELLOW:
        return "yellow";
      case StatusColors.RED:
        return colors.warningRed;
      default:
        return colors.successGreen;
    }
  }};
`;

const ItemAndIconContainer = styled.div`
  display: flex;
  align-items: center;
  gap: 0.5rem;
  flex-direction: flex-start;

  &:hover {
    color: #6C757D;
    box-shadow: none;
    ${StyledRepeat},
    ${StyledWifi} {
      color: #6C757D;
    }
  }

  padding: 8px 0px;
`;

const DropdownItem = styled.div`
  color: inherit;
  text-decoration: none;
  padding-top: 2px;
`;

const VersionLabel = styled.div`
  font-size: 13px;
  color: ${colors.white};
  opacity: 0.3;
  text-align: left;
`;
