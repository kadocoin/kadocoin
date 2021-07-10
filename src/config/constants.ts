import { TTransactionChild } from '../types';
import size from '../util/size';

const INITIAL_DIFFICULTY = 1;
export const MINE_RATE = 1000;
export const DEFAULT_MESSAGE = 'Welcome to Kadocoin API. Visit https://kadocoin.com';

const transactions: Array<TTransactionChild> = [];
const GENESIS_DATA = {
  timestamp: 1,
  lastHash: '____',
  hash: 'hash-one',
  difficulty: INITIAL_DIFFICULTY,
  nonce: 0,
  transactions,
  blockSize: '',
  totalTransactionsAmount: (0).toFixed(0),
  blockReward: (0).toFixed(0),
  msgReward: (0).toFixed(0),
  blockchainHeight: 1,
};

const genesisBlockSize = size(GENESIS_DATA);

GENESIS_DATA.blockSize = genesisBlockSize;

export { GENESIS_DATA };

export const STARTING_BALANCE = 1000;
export const MINING_REWARD = (50).toFixed(8);
export const REWARD_INPUT = {
  timestamp: 1624848894788,
  amount: MINING_REWARD,
  address: '',
  publicKey: '',
  localPublicKey: '',
  recipient: '',
  signature: '',
  message: '',
};
export const COINS_IN_CIRCULATION = 0;

export const swaggerOptions = {
  swaggerDefinition: {
    info: {
      description: 'Kadocoin MultiWallet API',
      title: 'Kadocoin MultiWallet API',
      version: '1.0.0',
      contact: {
        name: 'Adamu Muhammad Dankore',
        url: 'https://dankore.com',
        email: 'adamu@kadocoin.com',
      },
      license: {
        name: 'MIT',
        url: 'https://kadocoin.com/license',
      },
    },
    externalDocs: {
      url: 'https://kadocoin.com/terms',
      description: 'Terms of Use',
    },
    consumes: ['application/json'],
    tags: [
      { name: 'Registration', description: 'API' },
      { name: 'Login', description: 'API' },
    ],
    uiConfig: {
      docExpansion: 'full',
      deepLinking: false,
    },
    staticCSP: true,
    host: 'localhost:2000',
    basePath: '/',
    produces: ['application/json', 'application/xml'],
    schemes: ['http', 'https'],
  },
  basedir: __dirname,
  apis: ['./src/routes/userRouter.router.ts'], //Path to the API route handle folder
};

export const sampleDataForTests = {
  id: '2d5791f0-d9af-11eb-ac13-099d1d20fcfc',
  output: {
    '0xC6d23c6703f33F5ad74E6E4fc17C1CE9397D4AAD': '770.00000000',
    '0x86045b56bfeb1A35C6818081130BA0F789dc27c9': '230.00000000',
  },
  input: {
    timestamp: 1625063196815,
    amount: '1000.00000000',
    address: '0xC6d23c6703f33F5ad74E6E4fc17C1CE9397D4AAD',
    publicKey:
      '0460eeaa6a2393801ca90356bab01b6d206b9a431d8475f3ebff6999eef7199ad0b0f98e2aa354b24386b072553071dfe100574667584c11b518ea1e36ba959bb4',
    localPublicKey:
      '04b9c0f354c36f7df448ed4125480e84aad425b1851e1736c90d08835e4a77e9e7d33bfda4df16b8bf13d933592942aafdeefc2dac7450c833dbdbf445abe258dc',
    signature: '7fd13c4a4175fda39615766a5f0bfce40c0aeccd1d38c5f9e2ab7f8744ac26e2',
  },
};
