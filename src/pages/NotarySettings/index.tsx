import React, { useEffect, useCallback, useState } from 'react';
import { Check, RefreshCw } from 'react-feather';
import { useDispatch, useSelector } from 'react-redux';
import styled from 'styled-components';
import { colors } from '@theme/colors';
import { ThemedText } from '@theme/text';
import { AppDispatch } from '@utils/store';
import { API_CONFIGURATIONS } from '@utils/types';
import { AppRootState } from 'reducers';
import { setApiUrls, measureLatency, useBestLatency } from '../../reducers/settings';
import { LabeledSwitch } from '@newcomponents/common/LabeledSwitch';

const Settings: React.FC = () => {
  
  /*
  * Contexts
  */
  const dispatch = useDispatch<AppDispatch>();
  const { notary, proxy, latencies, autoSelect } = useSelector((state: AppRootState) => state.settings);
  const bestLatency = useBestLatency();

  /*
   * State
   */
  const [loadingLatency, setLoadingLatency] = useState(false);
  const [shouldAutoselect, setShouldAutoselect] = useState<boolean>(false);

  /*
   * State
   */

  useEffect(() => {
    if (autoSelect === "autoselect") {
      setShouldAutoselect(true);
    } else {
      setShouldAutoselect(false);
    }
  }, [autoSelect]);

  /*
   * Handler
   */

  const handleApiChange = useCallback((newNotary: string, newProxy: string) => {
    dispatch(setApiUrls({ notary: newNotary, proxy: newProxy, autoSelect: "manual" }));
    setShouldAutoselect(false);
  }, [dispatch]);

  const handleRefreshClicked = useCallback(async () => {
    setLoadingLatency(true);
    try {
      await dispatch(measureLatency(API_CONFIGURATIONS.map(config => config.notary)));
    } catch (error) {
      console.error('Error measuring latency:', error);
    }
    setLoadingLatency(false);
  }, [dispatch, loadingLatency]);

  const handleAutoselectChange = useCallback((checked: boolean) => {
    const bestApiConfiguration = API_CONFIGURATIONS.find((config) => config.notary === notary);
    
    if (bestApiConfiguration) {
      dispatch(setApiUrls({
        notary: checked ? bestLatency.url : notary,
        proxy: checked ? bestApiConfiguration.proxy : proxy,
        autoSelect: checked ? "autoselect" : "manual" 
      }));
      setShouldAutoselect(checked);
    }

  }, [dispatch, notary, proxy, autoSelect]);

  /*
   * Component
   */

  return (
    <Container>
      <BodyContainer>
        <BodyStepContainer>
          <NotarySettingContainer>
            <SettingsLabelContainer>
              <SettingsAndRefreshContainer>
                <ThemedText.LabelSmall textAlign="left">
                  Notary
                </ThemedText.LabelSmall>
                
                <StyledRefresh onClick={handleRefreshClicked} />
              </SettingsAndRefreshContainer>

              <LabeledSwitch
                switchChecked={shouldAutoselect}
                checkedLabel={"Auto"}
                uncheckedLabel={"Manual"}
                onSwitchChange={(checked: boolean) => handleAutoselectChange(checked)}
              /> 
            </SettingsLabelContainer>

          </NotarySettingContainer>

          <NotaryTableContainer>
            <NotaryHeaderRow>
              <NotaryColumnHeader>Location</NotaryColumnHeader>
              <NotaryColumnHeader>Latency</NotaryColumnHeader>
            </NotaryHeaderRow>
            
            {API_CONFIGURATIONS.map((config, index) => (
              <NotaryOptionRow
                key={index}
                lastRow={index === API_CONFIGURATIONS.length - 1}
                onClick={() => handleApiChange(config.notary, config.proxy)}
              >
                <NotaryOptionTitle>
                  {`${config.name}`}
                </NotaryOptionTitle>

                <NotaryLatencySubtitle>
                  {loadingLatency ?
                    'Loading...' : 
                    (config.shouldPing ? `${latencies[config.notary]} ms` : 'N/A')
                  }
                </NotaryLatencySubtitle>

                <StyledCheck visibility={notary === config.notary ? 'visible' : 'hidden'} />
              </NotaryOptionRow>
            ))}
          </NotaryTableContainer>
        </BodyStepContainer>
      </BodyContainer>
    </Container>
  );
}

const Container = styled.div`
  width: 100%;
  justify-content: center;
  border-radius: 16px;
  padding: 0rem 1.5rem;
  color: #FFFFFF;
`;

const BodyContainer = styled.div`
  display: flex;
  flex-direction: column;
  border-radius: 16px;
  gap: 1.5rem;
`;

const BodyStepContainer = styled.div`
  display: flex;
  flex-direction: column;
  justify-content: flex-start;
  gap: 0.75rem;
`;

const NotaryTableContainer = styled.div`
  display: block;
`;

const NotarySettingContainer = styled.div`
  display: flex;
  flex-direction: column;
  padding: 0rem 1rem;
  gap: 0.5rem;
  text-align: center;
  color: ${colors.white};
  width: 100%;
`;

const SettingsLabelContainer = styled.div`
  font-size: 14px;
  display: flex;
  align-items: center;
  gap: 1rem;
  justify-content: space-between;
`;

const SettingsAndRefreshContainer = styled.div`
  display: flex;
  align-items: center;
  gap: 1rem;
`;

const NotaryOptionRow = styled.div<{ lastRow: boolean }>`
  display: grid;
  grid-template-columns: 0.75fr 0.75fr 24px;
  gap: 24px;
  padding: 0.55rem 0.5rem;
  background-color: ${colors.selectorColor};

  border-left: 1px solid ${colors.defaultBorderColor};
  border-right: 1px solid ${colors.defaultBorderColor};
  border-top: 1px solid ${colors.defaultBorderColor};
  border-bottom: ${({ lastRow }) => lastRow ? '1px solid' : 'none'} ${colors.defaultBorderColor};

  border-radius: ${({ lastRow }) => {
    if (lastRow) {
      return '0 0 8px 8px';
    } else {
      return '0';
    }
  }};

  &:hover {
    background-color: ${colors.selectorHover};
    cursor: pointer;
  }
`;

const NotaryOptionTitle = styled.div`
  padding-left: 0.5rem;
  font-size: 13px;
  color: #ffffff;
`;

const NotaryLatencySubtitle = styled.div`
  padding-left: 0.5rem;
  font-size: 13px;
  color: #ffffff;
`;

const NotaryHeaderRow = styled.div`
  display: grid;
  grid-template-columns: 0.75fr 0.75fr 24px;
  gap: 24px;
  padding: 0.55rem 0.5rem;
  background-color: ${colors.selectorColor};
  border-left: 1px solid ${colors.defaultBorderColor};
  border-right: 1px solid ${colors.defaultBorderColor};
  border-top: 1px solid ${colors.defaultBorderColor};
  border-radius: 8px 8px 0 0;
`;

const NotaryColumnHeader = styled.div`
  padding-left: 0.5rem;
  font-size: 12px;
  opacity: 0.7;
`;

const StyledCheck = styled(Check)`
  margin-right: 0.5rem;
  color: ${colors.white};
  height: 16px;
  width: 16px;
`;

const StyledRefresh = styled(RefreshCw)`
  height: 16px;
  width: 16px;

  &:hover:not([disabled]) {
    color: #495057;
  }
  cursor: pointer;
`;

export default Settings;
