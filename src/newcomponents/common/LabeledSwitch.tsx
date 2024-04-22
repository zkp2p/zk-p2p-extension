import React from 'react';
import { Switch } from '@mui/material';
import styled from 'styled-components';

interface LabeledSwitchProps {
  switchChecked: boolean;
  onSwitchChange: (checked: boolean) => void;
  checkedLabel?: string;
  uncheckedLabel?: string;
}

export const LabeledSwitch: React.FC<LabeledSwitchProps> = ({
  switchChecked = true,
  onSwitchChange,
  checkedLabel = 'Checked Label',
  uncheckedLabel = 'Unchecked Label',
}) => {
  const handleSwitchChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    onSwitchChange(event.target.checked);
  };

  return (
    <Container>
      <SwitchLabel>
        {switchChecked ? checkedLabel : uncheckedLabel}
      </SwitchLabel>

      <Switch
        checked={switchChecked}
        onChange={handleSwitchChange}
        color={switchChecked ? 'primary' : 'secondary'}
      />
    </Container>
  )
};

const Container = styled.div`
  display: flex;
  justify-content: flex-end;
  align-items: center;
`;

const SwitchLabel = styled.span`
  color: '#888888';
  padding-right: 4px;
`;
