export const DEFAULT_API_CONFIGURATIONS = [
  {
    name: 'Local',
    notary: 'http://0.0.0.0:7047',
    proxy: 'ws://localhost:55688',
    shouldPing: false,
  },
  {
    name: 'N. California',
    notary: 'https://notary-us-west-1.zkp2p.xyz',
    proxy: 'wss://notary-us-west-1.zkp2p.xyz/proxy',
    shouldPing: true,
  }
];

export const StatusColors = {
  GREEN: 'GREEN',
  YELLOW: 'YELLOW',
  RED: 'RED',
} as const;

export type StatusColorsType = keyof typeof StatusColors;