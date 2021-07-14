/*
 * # Kadocoin License
 *
 * Copyright (c) 2021 Adamu Muhammad Dankore
 * Distributed under the MIT software license, see the accompanying
 * file LICENSE or <http://www.opensource.org/licenses/mit-license.php>
 */
import { REWARD_INPUT, TTransactionChild } from '../types';
import size from '../util/size';

const INITIAL_DIFFICULTY = 10;
export const MINE_RATE = 5000;
export const DEFAULT_MESSAGE = 'Welcome to Kadocoin API. Visit https://kadocoin.org';

const transactions: Array<TTransactionChild> = [];
const GENESIS_DATA = {
  timestamp: 1626071497054,
  lastHash: '*None*',
  hash: '*None*',
  difficulty: INITIAL_DIFFICULTY,
  nonce: 0,
  transactions,
  blockSize: '',
  transactionVolume: '',
  blockReward: '',
  blockchainHeight: 1,
};

const genesisBlockSize = size(GENESIS_DATA);

GENESIS_DATA.blockSize = genesisBlockSize;

export { GENESIS_DATA };

export const STARTING_BALANCE = 1000;
const REWARD_INPUT: REWARD_INPUT = {
  timestamp: 1624848894788,
  amount: '',
  address: '',
  publicKey: '',
  localPublicKey: '',
  recipient: '',
  signature: '',
};

export { REWARD_INPUT };
export const COINS_IN_CIRCULATION = 0;

const ENVIRONMENT = process.env.NODE_ENV || 'development';
const prod = ENVIRONMENT === 'production';
const HOST = prod ? 'api.kadocoin.org' : 'localhost:2000';

export const swaggerOptions = {
  swaggerDefinition: {
    info: {
      description: 'Kadocoin MultiWallet API',
      title: 'Kadocoin MultiWallet API',
      version: '1.0.0',
      contact: {
        name: 'Adamu Muhammad Dankore',
        url: 'https://dankore.com',
        email: 'adamu.dankore@gmail.com',
      },
      license: {
        name: 'MIT',
        url: 'https://kadocoin.org/license',
      },
    },
    externalDocs: {
      url: 'https://kadocoin.org/terms',
      description: 'Terms of Use',
    },
    consumes: ['application/json'],
    uiConfig: {
      docExpansion: 'full',
      deepLinking: false,
    },
    staticCSP: true,
    host: HOST,
    basePath: '/',
    produces: ['application/json', 'application/xml'],
  },
  basedir: __dirname,
  apis: ['./src/routes/*.ts'], //Path to the API route handle folder
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

export const NOT_ENOUGH = 'Insufficient balance';
