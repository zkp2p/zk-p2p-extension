import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import styled from 'styled-components';
import { Settings } from 'react-feather';

import logo from '../../assets/img/logo192.png';


export const TopNav: React.FC<{ withoutLinks?: boolean }> = ({ withoutLinks }) => {
  const location = useLocation();

  const [selectedItem, setSelectedItem] = useState<string>('Home');

  useEffect(() => {
    const capitalize = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);
    
    const routeName = location.pathname.split('/')[1];

    setSelectedItem(routeName ? capitalize(routeName) : 'Home');
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

      <StyledSettings />
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
  text-transform: uppercase;
  letter-spacing: 0.04em;
  color: #ffffff;
  text-decoration: none;
  font-size: 1.2rem;
  img {
    width: ${({ size }) => size || 32}px;
    height: ${({ size }) => size || 32}px;
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
  font-size: 20px;
  font-weight: 600;
  color: #ffffff;
`;

const StyledSettings = styled(Settings)`
  color: #fff;
  width: 20px;
  height: 20px;
`;