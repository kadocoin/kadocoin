const data = [
  {
    timestamp: 1,
    lastHash: '____',
    hash: 'hash-one',
    transactions: [],
    nonce: 0,
    difficulty: 10,
    blockSize: '147',
    totalTransactionsAmount: '0',
    blockReward: '0',
    msgReward: '0',
    blockchainHeight: 1,
  },
  {
    timestamp: 1625891648368,
    lastHash: 'hash-one',
    hash: '006dde793e4b47178748e07b10984393c270a1ef584ccb7b93a952493c9fe32a',
    transactions: [
      {
        id: '0cb32fa0-e138-11eb-978e-7337f253b12b',
        output: {
          '0xC6d23c6703f33F5ad74E6E4fc17C1CE9397D4AAD': '985.00000000',
          '0x86045b56bfeb1A35C6818081130BA0F789dc27c9': '15.00000000',
        },
        input: {
          timestamp: 1625891641243,
          amount: '1000.00000000',
          address: '0xC6d23c6703f33F5ad74E6E4fc17C1CE9397D4AAD',
          publicKey:
            '0460eeaa6a2393801ca90356bab01b6d206b9a431d8475f3ebff6999eef7199ad0b0f98e2aa354b24386b072553071dfe100574667584c11b518ea1e36ba959bb4',
          localPublicKey:
            '040e6d3afa36f1c04a9a0502466f77257475d458c8a0e20948ce119ad6dfa279cd8cd2a1f4887fc1d1cc1ce59f9d17de359cd20ae00a10c2d16c442d214cd8ee34',
          signature: {
            r: '93ab09ea9d8470ba7a5d551399e10ed58696a7a31b9b43605664ba087aa96d9f',
            s: '3c041c9498109d162b1657de2926791ed58df37939a70b47e7fe8c5b7fe1062a',
            recoveryParam: 0,
          },
        },
      },
      {
        id: '10efc7e0-e138-11eb-978e-7337f253b12b',
        output: { '0x86045b56bfeb1A35C6818081130BA0F789dc27c9': '50.00000000' },
        input: {
          timestamp: 1624848894788,
          amount: '50.00000000',
          address: '',
          publicKey: '',
          localPublicKey: '',
          recipient: '0x86045b56bfeb1A35C6818081130BA0F789dc27c9',
          signature: '',
          message: 'Miner message goes here',
        },
      },
    ],
    nonce: 597,
    difficulty: 9,
    blockSize: '1,002',
    totalTransactionsAmount: '65.00000000',
    blockReward: '50.00000000',
    msgReward: '0.00000000',
    blockchainHeight: 2,
  },
  {
    timestamp: 1625891658374,
    lastHash: '006dde793e4b47178748e07b10984393c270a1ef584ccb7b93a952493c9fe32a',
    hash: '00c43d45d7fbf31942eb5a4555aeb2bdd308048c6a997acd5821ca210c6b5a68',
    transactions: [
      {
        id: '154c6b40-e138-11eb-978e-7337f253b12b',
        output: {
          '0xC6d23c6703f33F5ad74E6E4fc17C1CE9397D4AAD': '967.00000000',
          '0x86045b56bfeb1A35C6818081130BA0F789dc27c9': '15.00000000',
          'msg-fee-0x86045b56bfeb1A35C6818081130BA0F789dc27c9': '3.00000000',
        },
        input: {
          timestamp: 1625891655669,
          amount: '985.00000000',
          address: '0xC6d23c6703f33F5ad74E6E4fc17C1CE9397D4AAD',
          publicKey:
            '0460eeaa6a2393801ca90356bab01b6d206b9a431d8475f3ebff6999eef7199ad0b0f98e2aa354b24386b072553071dfe100574667584c11b518ea1e36ba959bb4',
          localPublicKey:
            '040e6d3afa36f1c04a9a0502466f77257475d458c8a0e20948ce119ad6dfa279cd8cd2a1f4887fc1d1cc1ce59f9d17de359cd20ae00a10c2d16c442d214cd8ee34',
          signature: {
            r: '5f8af6b13fe35bfde426488d92ea66f7d793570852a92a29be43db30e2f70f7d',
            s: '61a152f35fa5cff124c8cc57dc2d29cb0767331e016dc81cce071f6035c1142e',
            recoveryParam: 1,
          },
          message: 'abu',
        },
      },
      {
        id: '16e840f0-e138-11eb-978e-7337f253b12b',
        output: { '0x86045b56bfeb1A35C6818081130BA0F789dc27c9': '50.00000000' },
        input: {
          timestamp: 1624848894788,
          amount: '50.00000000',
          address: '',
          publicKey: '',
          localPublicKey: '',
          recipient: '0x86045b56bfeb1A35C6818081130BA0F789dc27c9',
          signature: '',
          message: 'Miner message goes here',
        },
      },
    ],
    nonce: 250,
    difficulty: 8,
    blockSize: '1,128',
    totalTransactionsAmount: '68.00000000',
    blockReward: '50.00000000',
    msgReward: '3.00000000',
    blockchainHeight: 3,
  },
];
console.log(JSON.parse(data));
