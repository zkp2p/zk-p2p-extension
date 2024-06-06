import React, { useEffect, useCallback, useState } from 'react';
import { RefreshCw } from 'react-feather';
import { useDispatch, useSelector } from 'react-redux';
import { AppRootState } from 'reducers';
import styled from 'styled-components';

import { colors } from '@theme/colors';
import { AppDispatch } from '@utils/store';
import { setApiUrls, measureLatency, useBestLatency } from '@reducers/settings';
import { CustomCheckbox } from '@components/common/Checkbox';
import { NotaryConfiguration } from '@hooks/useFetchNotaryList';

interface NotarySettingsProps {
  notaryList: NotaryConfiguration[] | null;
}

const NotarySettings: React.FC<NotarySettingsProps> = ({
  notaryList
}) => {
  const dispatch = useDispatch<AppDispatch>();
  const { notary, proxy, latencies, autoSelect } = useSelector((state: AppRootState) => state.settings);
  
  /*
   * Contexts
   */

  const bestLatency = useBestLatency();

  /*
   * State
   */

  const [loadingLatency, setLoadingLatency] = useState<boolean>(false);

  const [shouldAutoselect, setShouldAutoselect] = useState<boolean>(false);

  /*
   * Hooks
   */

  useEffect(() => {
    setShouldAutoselect(autoSelect === "autoselect");
  }, [autoSelect]);

  /*
   * Handler
   */

  const handleApiChange = useCallback((newNotary: string, newProxy: string) => {
    dispatch(
      setApiUrls(
        { notary: newNotary, proxy: newProxy, autoSelect: "manual" }
      )
    );

    setShouldAutoselect(false);
  }, [dispatch]);

  const handleRefreshClicked = useCallback(async () => {
    setLoadingLatency(true);

    try {
      if (notaryList) {
        await dispatch(measureLatency(notaryList.map(config => config.notary)));
      }
    } catch (error) {
      console.error('Error measuring latency:', error);
    }

    setLoadingLatency(false);
  }, [dispatch, loadingLatency, notaryList]);

  const handleAutoselectChange = useCallback((checked: boolean) => {
    if (!notaryList) return;

    const bestApiConfiguration = notaryList.find(config => config.notary === notary);
    
    if (bestApiConfiguration) {
      dispatch(setApiUrls({
        notary: checked ? bestLatency.url : notary,
        proxy: checked ? bestApiConfiguration.proxy : proxy,
        autoSelect: checked ? "autoselect" : "manual" 
      }));

      setShouldAutoselect(checked);
    }
  }, [dispatch, notary, proxy, autoSelect, notaryList]);

  const onCheckboxChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    handleAutoselectChange(event.target.checked);
  };

  /*
   * Helpers
   */

  const orderedNotaries = notaryList && notaryList.sort((a, b) => {
    if (latencies[a.notary] === '-' && latencies[b.notary] === '-') {
      return 0;
    } else if (latencies[a.notary] === '-') {
      return 1;
    } else if (latencies[b.notary] === '-') {
      return -1;
    } else {
      return parseInt(latencies[a.notary]) - parseInt(latencies[b.notary]);
    }
  });

  /*
   * Component
   */

  return (
    <Container>
      <BodyContainer>
        <AutoSelectNotaryContainer>
          <CustomCheckbox
            checked={shouldAutoselect}
            onChange={onCheckboxChange}
          />

          <AutoSelectNotaryTitle>
            Automatically select the best notary based on my location
          </AutoSelectNotaryTitle>
        </AutoSelectNotaryContainer>

        <OrContainer>
          Or
        </OrContainer>

        <SelectNotaryContainer>
          <SelectLabel>
            <AutoSelectNotaryTitle>
              Select a notary. Notarization requires a reliable internet connection
            </AutoSelectNotaryTitle>
          </SelectLabel>
        </SelectNotaryContainer>

        <NotaryGrid>
          {orderedNotaries && orderedNotaries.map((config, index) => {
            return (
              <NotaryCard
                key={index}
                onClick={() => handleApiChange(config.notary, config.proxy)}
              >
                <NotaryTitleContainer>
                  <NotaryTItle>
                    {config.name}
                  </NotaryTItle>

                  <NotarySubtitle>
                    {loadingLatency ? 'Loading...' : `Ping: ${latencies[config.notary]}ms`}
                  </NotarySubtitle>
                </NotaryTitleContainer>

                <CustomCheckbox
                  checked={notary === config.notary}
                  onChange={() => handleApiChange(config.notary, config.proxy)}
                />
              </NotaryCard>
            );
          })}
        </NotaryGrid>

        <RefreshButtonContainer onClick={handleRefreshClicked}>
          <StyledRefresh/>
          Refresh Pings
        </RefreshButtonContainer>

        <DisclaimerLabel>
          High latency may cause notarization to fail
        </DisclaimerLabel>
      </BodyContainer>
    </Container>
  );
}

const Container = styled.div`
  width: 100%;
  justify-content: center;
  border-radius: 16px;
  padding: 0rem 1.5rem 2rem;
  overflow: auto;
`;

const BodyContainer = styled.div`
  display: flex;
  flex-direction: column;
  border-radius: 16px;
  gap: 0.5rem;
`;

const AutoSelectNotaryContainer = styled.div`
  display: flex;
  align-items: center;
  gap: 1rem;
  padding: 0 0.75rem;
`;

const OrContainer = styled.div`
  padding: -0.75rem 0;
  font-size: 15px;
  color: ${colors.white};
  text-align: center;
`;

const AutoSelectNotaryTitle = styled.div`
  font-size: 14px;
  color: ${colors.white};
`;

const SelectNotaryContainer = styled.div`
  display: flex;
  gap: 1rem;
  padding: 0 0.75rem;
`;

const SelectLabel = styled.div`
  font-size: 14px;
  color: ${colors.white};
`;

const NotaryGrid = styled.div`
  display: grid;
  padding-top: 0.25rem;
  grid-template-columns: repeat(auto-fit, minmax(120px, 1fr));
  gap: 0.5rem;
`;

const NotaryCard = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;

  flex-wrap: nowrap;
  border-radius: 12px;
  padding: 0.85rem 1.25rem;
  background-color: ${colors.selectorColor};

  &:hover {
    background-color: ${colors.selectorHover};
    cursor: pointer;
  }
`;

const NotaryTitleContainer = styled.div`
  display: flex;
  flex-direction: column;
`;

const NotaryTItle = styled.div`
  font-size: 13px;
  font-weight: 600;
  color: ${colors.white};
`;

const NotarySubtitle = styled.div`
  font-size: 12px;
  color: #CED4DA;
`;

const RefreshButtonContainer = styled.div`
  display: flex;
  gap: 0.5rem;
  align-items: center;
  justify-content: center;
  padding-top: 1rem;

  font-size: 15px;
  font-weight: 600;
  color: ${colors.white};

  &:hover:not([disabled]) {
    color: #495057;
  }
  
  cursor: pointer;
`;

const StyledRefresh = styled(RefreshCw)`
  padding-bottom: 2px;
  height: 20px;
  width: 20px;
`;

const DisclaimerLabel = styled.div`
  font-size: 13px;
  color: ${colors.warningRed};
  padding: 0.25rem 0.75rem;
  text-align: center;
`;

export default NotarySettings;
