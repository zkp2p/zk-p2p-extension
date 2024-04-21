import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import { get, set, NOTARY_API_LS_KEY, PROXY_API_LS_KEY } from '../utils/storage';

interface ApiUrlsState {
  notary: string;
  proxy: string;
  latencies: { [key: string]: string };
}

interface LatencyPayload {
  url: string;
  latency: string;
}

const initialState: ApiUrlsState = {
  notary: 'https://notary-us-east-1.zkp2p.xyz',
  proxy: 'wss://notary-us-east-1.zkp2p.xyz/proxy',
  latencies: {}
};

export const fetchApiUrls = createAsyncThunk(
  'settings/fetchApiUrls',
  async () => {
    const notary = await get(NOTARY_API_LS_KEY);
    const proxy = await get(PROXY_API_LS_KEY);
    return { notary, proxy };
  }
);

export const setApiUrls = createAsyncThunk(
  'settings/setApiUrls',
  async ({ notary, proxy }: { notary: string; proxy: string }) => {
    await set(NOTARY_API_LS_KEY, notary);
    await set(PROXY_API_LS_KEY, proxy);
    return { notary, proxy };
  }
);

export const measureLatency = createAsyncThunk(
  'settings/measureLatency',
  async (url: string, { rejectWithValue }) => {
    const startTime = performance.now();
    try {
      const response = await fetch(url);
      if (!response.ok) {
        throw new Error('Network response was not ok');
      }
      const endTime = performance.now();
      const latency = (endTime - startTime).toFixed(2);
      return { url, latency };
    } catch (error) {
      return rejectWithValue('Failed to measure latency');
    }
  }
);

const settingsSlice = createSlice({
  name: 'settings',
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchApiUrls.fulfilled, (state, action: PayloadAction<{ notary: string; proxy: string }>) => {
        state.notary = action.payload.notary;
        state.proxy = action.payload.proxy;
      })
      .addCase(setApiUrls.fulfilled, (state, action: PayloadAction<{ notary: string; proxy: string }>) => {
        state.notary = action.payload.notary;
        state.proxy = action.payload.proxy;
      })
      .addCase(measureLatency.fulfilled, (state, action: PayloadAction<LatencyPayload>) => {
        const { url, latency } = action.payload;
        state.latencies[url] = latency;
      });
  },
});

export default settingsSlice.reducer;