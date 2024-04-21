import React, { useEffect, useRef, useReducer, useState } from 'react';
import { Settings as SettingsIcon, Circle, Edit, Repeat } from 'react-feather';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router';
import styled from 'styled-components';

import { useOnClickOutside } from '@hooks/useOnClickOutside';
import { ThemedText } from '@theme/text';
import { colors } from '@theme/colors';
import { SVGIconThemed } from '@newcomponents/SVGIcon/SVGIconThemed';
import { Overlay } from '@newcomponents/common/Overlay';
import { AppDispatch } from '@utils/store';
import { API_CONFIGURATIONS } from '@utils/types';
import { AppRootState } from 'reducers';
import { fetchApiUrls } from '../../reducers/settings';

const CLIENT_VERSION = '0.0.1';

export const Settings = () => {
  const [isOpen, toggleOpen] = useReducer((s) => !s, false)

  const ref = useRef<HTMLDivElement>(null)
  useOnClickOutside(ref, isOpen ? toggleOpen : undefined)
  const navigate = useNavigate();
  const dispatch = useDispatch<AppDispatch>();

  const { notary } = useSelector((state: AppRootState) => state.settings);
  
  /*
   * State
   */
  const [notaryName, setNotaryName] = useState<string | null>(null);

  /* 
   * Hooks
   */
  useEffect(() => {
    dispatch(fetchApiUrls());

    if (notary) {
      const fetchNotaryName = API_CONFIGURATIONS.find((config) => config.notary === notary);
      if (fetchNotaryName) {
        setNotaryName(fetchNotaryName.name);
      }
    }
  }, [dispatch, notaryName, notary]);

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
            <ConnectedNotaryContainer>
              <ConnectedContainer>
                <ConnectedLabel>
                  Connected
                </ConnectedLabel>
                <StyledCircle fill={colors.successGreen} />
              </ConnectedContainer>

              <CurrentNotaryContainer>
                <CurrentNotaryLink onClick={() => window.open(`${notary}/info`, '_blank')}>
                  {notaryName} ↗
                </CurrentNotaryLink>
              </CurrentNotaryContainer>

            </ConnectedNotaryContainer>

            <DropdownItemsContainer>
              <ItemAndIconContainer onClick={handleUpdateNotaryClick}>
                <StyledEdit />
                <DropdownItem>
                  Configure
                </DropdownItem>
              </ItemAndIconContainer>

              <ItemAndIconContainer onClick={() => window.open('https://zkp2p.xyz/', '_blank')}>
                <StyledRepeat />
                <DropdownItem>
                  App ↗
                </DropdownItem>
              </ItemAndIconContainer>
            </DropdownItemsContainer>

            <IconRow>
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
            </IconRow>
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
  width: 184px;
  border-radius: 12px;
  border: 1px solid rgba(255, 255, 255, 0.2);
  padding: 1rem 1.25rem;
  background: #1B1B1B;
  position: absolute;
  top: calc(100% + 20px);
  right: 0;
  z-index: 20;
  gap: 1rem;
  color: #FFFFFF;
`;

const ConnectedNotaryContainer = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
  white-space: nowrap;
  align-items: center;
  padding: 1rem;
  border-bottom: 1px solid ${colors.defaultBorderColor};
`;

const ConnectedLabel = styled.div`
  font-weight: 700;
  font-size: 16px;
`;

const IconRow = styled.div`
  display: flex;
  flex-direction: row;
  gap: 1rem;
  align-items: center;
`;

const Icon = styled(SVGIconThemed)`
  width: 20px;
  height: 20px;
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
  font-size: 16px;
  font-weight: 600;
  text-decoration: none;
  padding: 0rem 0.25rem;
  cursor: pointer;
  line-height: 1;
`;

const StyledCircle = styled(Circle)`
  color: ${colors.successGreen};
  height: 8px;
  width: 8px;
`;

const StyledEdit = styled(Edit)`
  color: ${colors.white};
  height: 16px;
  width: 16px;
`;

const StyledRepeat = styled(Repeat)`
  color: ${colors.white};
  height: 16px;
  width: 16px;
`;

const ItemAndIconContainer = styled.div`
  display: flex;
  align-items: center;
  gap: 1rem;
  flex-direction: flex-start;

  &:hover {
    color: #6C757D;
    box-shadow: none;
    ${StyledRepeat},
    ${StyledEdit} {
      color: #6C757D;
    }
  }

  padding: 16px 0px;
`;

const DropdownItem = styled.div`
  color: inherit;
  text-decoration: none;
  padding-top: 2px;
`;

const CurrentNotaryContainer = styled.div`
  display: flex;
  flex-direction: row;
  gap: 0.5rem;
`;

const CurrentNotaryLink = styled.div`
  color: #1976D2;
  cursor: pointer;
  text-decoration: underline;
  font-size: 14px;

  &:hover {
    text-decoration: none;
  }
`;

const ConnectedContainer = styled.div`
  display: flex;
  flex-direction: row;
  align-items: center;
  gap: 0.5rem;
`;

const VersionLabel = styled.div`
  font-size: 14px;
  color: ${colors.white};
  opacity: 0.3;
  text-align: left;
`;
