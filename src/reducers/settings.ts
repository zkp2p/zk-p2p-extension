import { useSelector } from 'react-redux';
import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';

import { get, set, AUTOSELECT_LS_KEY, NOTARY_API_LS_KEY, PROXY_API_LS_KEY } from '../utils/storage';
import { AppRootState } from './index';


interface ApiUrlsState {
  notary: string;
  proxy: string;
  latencies: { [key: string]: string };
  autoSelect: 'autoselect' | 'manual';
}

const initialState: ApiUrlsState = {
  notary: 'https://notary-us-east-1.zkp2p.xyz',
  proxy: 'wss://notary-us-east-1.zkp2p.xyz/proxy',
  latencies: {},
  autoSelect: "autoselect"
};

export const fetchApiUrls = createAsyncThunk(
  'settings/fetchApiUrls',
  async () => {
    const notary = await get(NOTARY_API_LS_KEY);
    const proxy = await get(PROXY_API_LS_KEY);
    const autoSelect = await get(AUTOSELECT_LS_KEY);

    return { notary, proxy, autoSelect };
  }
);

export const setApiUrls = createAsyncThunk(
  'settings/setApiUrls',
  async ({ notary, proxy, autoSelect }: { notary: string; proxy: string, autoSelect: 'autoselect' | 'manual' }) => {
    await set(NOTARY_API_LS_KEY, notary);
    await set(PROXY_API_LS_KEY, proxy);
    await set(AUTOSELECT_LS_KEY, autoSelect);

    return { notary, proxy, autoSelect };
  }
);

export const measureLatency = createAsyncThunk(
  'settings/measureLatency',
  async (notaryUrls: string[], { rejectWithValue }) => {
    const measureSingleLatency = async (url: string) => {
      const startTime = performance.now();
      try {
        const response = await fetch(`${url}/info`);
        if (!response.ok) {
          throw new Error('Network response was not ok');
        }
        const endTime = performance.now();
        const latency = (endTime - startTime).toFixed(0);

        return { url, latency };
      } catch (error) {
        console.error(`Failed to measure latency for ${url}: ${error}`);

        return { url, latency: '-' };
      }
    };

    try {
      const results = await Promise.all(notaryUrls.map(notaryUrl => measureSingleLatency(notaryUrl)));
      return results.reduce((acc: { [key: string]: string }, result) => {
        acc[result.url] = result.latency;

        return acc;
      }, {});
    } catch (error) {
      return rejectWithValue('Failed to measure latencies');
    }
  }
);

const settingsSlice = createSlice({
  name: 'settings',
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchApiUrls.fulfilled, (state, action: PayloadAction<{ notary: string; proxy: string; autoSelect: 'autoselect' | 'manual' }>) => {
        state.notary = action.payload.notary;
        state.proxy = action.payload.proxy;
        state.autoSelect = action.payload.autoSelect;
      })
      .addCase(setApiUrls.fulfilled, (state, action: PayloadAction<{ notary: string; proxy: string, autoSelect: 'autoselect' | 'manual' }>) => {
        state.notary = action.payload.notary;
        state.proxy = action.payload.proxy;
        state.autoSelect = action.payload.autoSelect;
      })
      .addCase(measureLatency.fulfilled, (state, action: PayloadAction<{ [key: string]: string }>) => {
        state.latencies = { ...state.latencies, ...action.payload };
      });
  },
});

export default settingsSlice.reducer;

export const useBestLatency = () => {
  const latencies = useSelector((state: AppRootState) => state.settings.latencies);

  let bestLatency = Infinity;
  let bestUrl = '';

  Object.entries(latencies).forEach(([url, latency]) => {
      const isLocalNotary = url === 'http://0.0.0.0:7047';
      const numericLatency = parseFloat(latency);

      if (!isLocalNotary && !isNaN(numericLatency) && numericLatency < bestLatency) {
          bestLatency = numericLatency;
          bestUrl = url;
      }
  });

  return { url: bestUrl, latency: bestLatency === Infinity ? null : bestLatency.toFixed(0) };
};
