import React, { useCallback, useEffect, useRef, useReducer, useState } from 'react';
import { Settings as SettingsIcon, Check } from 'react-feather';
import styled from 'styled-components';

import { useOnClickOutside } from '@hooks/useOnClickOutside';
import { ThemedText } from '@theme/text';
import { colors } from '@theme/colors';
import { set, get, NOTARY_API_LS_KEY, PROXY_API_LS_KEY } from '../../utils/storage';


const CLIENT_VERSION = '0.0.1';
const API_CONFIGURATIONS = [
  {
    name: 'Local',
    notary: 'http://0.0.0.0:7047',
    proxy: 'ws://localhost:55688',
  },
  {
    name: 'Mumbai',
    notary: 'https://notary-mumbai.zkp2p.xyz',
    proxy: 'wss://proxy-mumbai.zkp2p.xyz',
  },
  {
    name: 'Ohio',
    notary: 'https://notary-ohio.zkp2p.xyz',
    proxy: 'wss://proxy-ohio.zkp2p.xyz',
  },
  {
    name: 'California',
    notary: 'https://notary-california.zkp2p.xyz',
    proxy: 'wss://proxy-california.zkp2p.xyz',
  },
];

export const Settings = () => {
  const [isOpen, toggleOpen] = useReducer((s) => !s, false)

  const ref = useRef<HTMLDivElement>(null)
  useOnClickOutside(ref, isOpen ? toggleOpen : undefined)

  /*
   * State
   */

  const [notary, setNotary] = useState('https://notary-california.zkp2p.xyz');
  const [proxy, setProxy] = useState('wss://proxy-california.zkp2p.xyz');

  /*
   * Hooks
   */

  useEffect(() => {
    (async () => {
      setNotary(await get(NOTARY_API_LS_KEY));
      setProxy(await get(PROXY_API_LS_KEY));
    })();
  }, []);

  /*
   * Handler
   */

  const handleApiChange = useCallback(async (newNotary, newProxy) => {
    setNotary(newNotary);
    setProxy(newProxy);
    await set(NOTARY_API_LS_KEY, newNotary);
    await set(PROXY_API_LS_KEY, newProxy);
  }, []);

  // no-op

  /*
   * Component
   */

  return (
    <Wrapper ref={ref}>
      <NavButton onClick={toggleOpen}>
        <StyledSettings />
      </NavButton>

      {isOpen && (
        <NavDropdown>
          <NotaryContainer>
            <ThemedText.LabelSmall textAlign="left">
              Notary
            </ThemedText.LabelSmall>
            
            <NotaryOptionsContainer>
              {API_CONFIGURATIONS.map((config, index) => (
                <NotaryOptionRow
                  topRow={index === 0}
                  lastRow={index === API_CONFIGURATIONS.length - 1}
                  onClick={() => handleApiChange(config.notary, config.proxy)}
                >
                  <NotaryOptionTitle>
                    {`${config.name}`}
                  </NotaryOptionTitle>

                  {notary === config.notary && (
                    <StyledCheck />
                  )}
                </NotaryOptionRow>
              ))}
            </NotaryOptionsContainer>
          </NotaryContainer>

          <IconRow>
            <VersionLabel>
              v{CLIENT_VERSION}
            </VersionLabel>
          </IconRow>
        </NavDropdown>
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
  width: 24px;
  height: 24px;
`;

const NavButton = styled.div`
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 10;
  padding-right: 8px;
`;

const NavDropdown = styled.div`
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

const NotaryContainer = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
`;

const NotaryOptionsContainer = styled.div`
  width: 100%;
  padding: 0rem 0.25rem;
`;

const NotaryOptionRow = styled.div<{ topRow: boolean, lastRow: boolean}>`
  display: flex;
  justify-content: space-between;
  padding: 0.55rem 0.5rem 0.45rem 0.5rem;
  background-color: ${colors.appBackground};

  border-left: 1px solid ${colors.defaultBorderColor};
  border-right: 1px solid ${colors.defaultBorderColor};
  border-top: ${({ topRow }) => topRow || !topRow ? '1px solid' : 'none'} ${colors.defaultBorderColor};
  border-bottom: ${({ lastRow }) => lastRow ? '1px solid' : 'none'} ${colors.defaultBorderColor};

  border-radius: ${({ topRow, lastRow }) => {
    if (topRow && lastRow) {
      return '8px 8px 8px 8px';
    } else if (topRow) {
      return '8px 8px 0 0';
    } else if (lastRow) {
      return '0 0 8px 8px';
    } else {
      return '0';
    }
  }};
`;

const NotaryOptionTitle = styled.div`
  padding-left: 0.5rem;
  font-size: 13px;
  color: #ffffff;
`;

const StyledCheck = styled(Check)`
  margin-right: 0.5rem;
  color: ${colors.white};
  height: 16px;
  width: 16px;
`;

const IconRow = styled.div`
  display: flex;
  flex-direction: row;
  gap: 1rem;
  align-items: center;
`;

const VersionLabel = styled.div`
  font-size: 14px;
  color: ${colors.white};
  opacity: 0.3;
  text-align: left;
`;
