import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import styled from 'styled-components';

import logo from '../../assets/img/logo192.png';
import { NotaryConfiguration } from '@hooks/useFetchNotaryList';
import { SettingsDropdown } from '@newcomponents/Settings';
import { colors } from '@theme/colors';


interface TopNavProps {
  notaryList: NotaryConfiguration[] | null;
}

export const TopNav: React.FC<TopNavProps> = ({
  notaryList
}) => {
  const location = useLocation();

  const [selectedItem, setSelectedItem] = useState<string>('Home');

  useEffect(() => {
    let selectedItem = '';
    switch (location.pathname) {
      case '/registration':
        selectedItem = 'Registration';
        break;

      case '/deposit':
        selectedItem = 'New Depositor';
        break;

      case '/onramp':
        selectedItem = 'On-Ramp';
        break;
      
      case '/settings':
        selectedItem = 'Configuration';
        break;

      default:
        selectedItem = 'Home';
    };

    setSelectedItem(selectedItem);
  }, [location]);

  return (
    <NavBar>
      <LogoAndNavItems>
        <Logo to="/" onClick={() => setSelectedItem('Home')}>
          <img src={logo} alt="logo" />
        </Logo>
      </LogoAndNavItems>

      <NavigationTitle>
        {selectedItem}
      </NavigationTitle>

      <SettingsDropdown
        notaryList={notaryList}
      />
    </NavBar>
  );
};

const NavBar = styled.nav`
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 1.5rem;
`;

const Logo = styled(Link)<{ size?: number }>`
  img {
    width: ${({ size }) => size || 28}px;
    height: ${({ size }) => size || 28}px;
    object-fit: cover;
  }
`;

const LogoAndNavItems = styled.div`
  display: flex;
  align-items: center;
  gap: 2rem;
`;

const NavigationTitle = styled.div`
  display: flex;
  font-size: 18px;
  font-weight: 600;
  color: ${colors.white};
`;
