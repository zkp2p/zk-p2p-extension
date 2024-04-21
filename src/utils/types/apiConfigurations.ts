export const API_CONFIGURATIONS = [
  {
    name: 'Local',
    notary: 'http://0.0.0.0:7047',
    proxy: 'ws://localhost:55688',
    shouldPing: false,
  },
  {
    name: 'N. Virginia 1',
    notary: 'https://notary-us-east-1.zkp2p.xyz',
    proxy: 'wss://notary-us-east-1.zkp2p.xyz/proxy',
    shouldPing: true,
  },
  // {
  //   name: 'Paris',
  //   notary: 'https://notary-paris.zkp2p.xyz',
  //   proxy: 'wss://proxy-california.zkp2p.xyz',
  //   shouldPing: true,
  // },
  {
    name: 'Frankfurt',
    notary: 'https://notary.pse.dev/v0.1.0-alpha.5',
    proxy: 'wss://notary-us-east-1.zkp2p.xyz/proxy',
    shouldPing: true,
  }
];