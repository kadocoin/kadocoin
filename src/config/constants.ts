/*
 * # Kadocoin License
 *
 * Copyright (c) 2021 Adamu Muhammad Dankore
 * Distributed under the MIT software license, see the accompanying
 * file LICENSE or <http://www.opensource.org/licenses/mit-license.php>
 */
import { REWARD_INPUT } from '../types';
import cryptoHash from '../util/crypto-hash';
import size from '../util/size';
import Transaction from '../wallet/transaction';
export const ENVIRONMENT = process.env.NODE_ENV || 'development';
const prod = ENVIRONMENT === 'production';

const INITIAL_DIFFICULTY = 10;
export const MINE_RATE = 5000;
export const DEFAULT_MESSAGE = 'Welcome to Kadocoin API. Visit https://kadocoin.org';

const transactions: Array<Transaction> = [];
const hash = '*None*';
const GENESIS_DATA = {
  timestamp: 1626071497054,
  lastHash: '*None*',
  hash,
  difficulty: INITIAL_DIFFICULTY,
  nonce: 0,
  transactions,
  blockSize: '',
  transactionVolume: '',
  blockReward: '',
  feeReward: '',
  hashOfAllHashes: cryptoHash(hash),
  blockchainHeight: 1,
};

const genesisBlockSize = size(GENESIS_DATA);

GENESIS_DATA.blockSize = genesisBlockSize;

export { GENESIS_DATA };

export const STARTING_BALANCE = 1000;
const REWARD_INPUT: REWARD_INPUT = {
  timestamp: 0,
  amount: '',
  address: '',
  publicKey: '',
  localPublicKey: '',
  recipient: '',
  signature: '',
};

export { REWARD_INPUT };
export const COINS_IN_CIRCULATION = 0;
export const NOT_ENOUGH = 'Insufficient balance';
export const blockchainStorageFile = prod ? 'data/blockchain.txt' : 'src/data/blockchain.txt';
export const peersStorageFile = prod ? 'data/peers.txt' : 'src/data/peers.txt';
export const hardCodedPeers = [
  { host: '192.168.0.148', port: 5346 }, // ABUJA
  // { host: '192.168.0.155', port: 5346 }, // UBUNTU
  { host: '192.168.0.2', port: 5346 }, // MAC
  { host: '192.168.0.151', port: 5346 }, // BAUCHI
];

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

export const sampleBlocks = [
  {
    timestamp: 1626071497054,
    lastHash: '*None*',
    hash: '*None*',
    transactions: [],
    nonce: 0,
    difficulty: 10,
    blockSize: '230',
    transactionVolume: '',
    blockReward: '',
    feeReward: '',
    blockchainHeight: 1,
    hashOfAllHashes: '91d7da959863806d9256aa7c48ddaf497fd3156825459fa0f754930320db9a69',
  },
  {
    timestamp: 1630978190500,
    lastHash: '*None*',
    hash: '006184d4751c4880ef0d732b76f8d46a17d395fbc9f0488a41f64f48b1468918',
    transactions: [
      {
        id: '1784b590-0f7b-11ec-968e-09008debbed9',
        output: {
          '0x1dcc99E8Da20FF2455461B6b4Afd7283E554A2Db': '960.00000000',
          '0x86045b56bfeb1A35C6818081130BA0F789dc27c9': '40.00000000',
        },
        input: {
          timestamp: 1630978189162,
          amount: '1000.00000000',
          address: '0x1dcc99E8Da20FF2455461B6b4Afd7283E554A2Db',
          publicKey:
            '04d4d9b0a09853a8d886360ae13bf5a25208e8c666982b5a0d3a80c2e91fb7fe6ec0c737cfeadac1ab8cdf67f5da723db7e124c45ccef07f10d53fe0b2103cb69f',
          localPublicKey:
            '04903a1dfd7d49ebb3d6f69968da1da9a267dea75a303eada48985cddd4197547ae706e45dd389be0f3a22fbf962a7420a902cc97877e52d84e73c18aa23990e05',
          signature: {
            r: 'da0f4b658758032fa567e753d5202491caaacc285af17c83c3d2bb4407ac02a9',
            s: '187c538ddcd3fb647fc065e7d95cc0653bcecaa6862f28d6ce77d714078b67ec',
            recoveryParam: 1,
          },
        },
      },
      {
        id: '184e4720-0f7b-11ec-968e-09008debbed9',
        output: {
          '0x1dcc99E8Da20FF2455461B6b4Afd7283E554A2Db': '50.00000000',
        },
        input: {
          timestamp: 1630978215295,
          amount: '',
          address: '',
          publicKey: '',
          localPublicKey: '',
          recipient: '0x1dcc99E8Da20FF2455461B6b4Afd7283E554A2Db',
          signature: '',
        },
      },
    ],
    nonce: 775,
    difficulty: 9,
    blockSize: '1,078',
    transactionVolume: '90.00000000',
    blockReward: '50.00000000',
    feeReward: '0.00000000',
    blockchainHeight: 2,
    hashOfAllHashes: 'c8013ff364db13877c33be317e437c31d07841bc52be28dc5a7a256d54cb0359',
  },
  {
    timestamp: 1630978198123,
    lastHash: '006184d4751c4880ef0d732b76f8d46a17d395fbc9f0488a41f64f48b1468918',
    hash: '00d62f8d1f23049cfd68ef1507f811e9593ce7ba525772ceeb0ed5476d75071e',
    transactions: [
      {
        id: '1c681520-0f7b-11ec-968e-09008debbed9',
        output: {
          '0x1dcc99E8Da20FF2455461B6b4Afd7283E554A2Db': '609.00000000',
          '0x86045b56bfeb1A35C6818081130BA0F789dc27c9': '401.00000000',
        },
        input: {
          timestamp: 1630978197362,
          amount: '1010.00000000',
          address: '0x1dcc99E8Da20FF2455461B6b4Afd7283E554A2Db',
          publicKey:
            '04d4d9b0a09853a8d886360ae13bf5a25208e8c666982b5a0d3a80c2e91fb7fe6ec0c737cfeadac1ab8cdf67f5da723db7e124c45ccef07f10d53fe0b2103cb69f',
          localPublicKey:
            '04903a1dfd7d49ebb3d6f69968da1da9a267dea75a303eada48985cddd4197547ae706e45dd389be0f3a22fbf962a7420a902cc97877e52d84e73c18aa23990e05',
          signature: {
            r: '59ffb668d278c5f08be5faa1932c7ceccdfdd738c26e4140862b2839dcaefb28',
            s: '55a6d08a2ae010491e408c527383a82a7c607217b119621748942afcf517a8e7',
            recoveryParam: 0,
          },
        },
      },
      {
        id: '1cda37e0-0f7b-11ec-968e-09008debbed9',
        output: {
          '0x1dcc99E8Da20FF2455461B6b4Afd7283E554A2Db': '50.00000000',
        },
        input: {
          timestamp: 1630978215295,
          amount: '',
          address: '',
          publicKey: '',
          localPublicKey: '',
          recipient: '0x1dcc99E8Da20FF2455461B6b4Afd7283E554A2Db',
          signature: '',
        },
      },
    ],
    nonce: 713,
    difficulty: 8,
    blockSize: '1,137',
    transactionVolume: '451.00000000',
    blockReward: '50.00000000',
    feeReward: '0.00000000',
    blockchainHeight: 3,
    hashOfAllHashes: 'cb68c6919b47540b9bd486acb98157c1def50c3892cd7ac38681af61d9e0aca2',
  },
  {
    timestamp: 1630978209324,
    lastHash: '00d62f8d1f23049cfd68ef1507f811e9593ce7ba525772ceeb0ed5476d75071e',
    hash: '00728fe9b45d40a6a4d75187853291f729ff8047d7b68744d5a5378b6de29850',
    transactions: [
      {
        id: '23016210-0f7b-11ec-968e-09008debbed9',
        output: {
          '0x1dcc99E8Da20FF2455461B6b4Afd7283E554A2Db': '657.00000000',
          '0x86045b56bfeb1A35C6818081130BA0F789dc27c9': '2.00000000',
        },
        input: {
          timestamp: 1630978208433,
          amount: '659.00000000',
          address: '0x1dcc99E8Da20FF2455461B6b4Afd7283E554A2Db',
          publicKey:
            '04d4d9b0a09853a8d886360ae13bf5a25208e8c666982b5a0d3a80c2e91fb7fe6ec0c737cfeadac1ab8cdf67f5da723db7e124c45ccef07f10d53fe0b2103cb69f',
          localPublicKey:
            '04903a1dfd7d49ebb3d6f69968da1da9a267dea75a303eada48985cddd4197547ae706e45dd389be0f3a22fbf962a7420a902cc97877e52d84e73c18aa23990e05',
          signature: {
            r: 'b7406825e88766806ee2f4c7bb240e0ecaaa9ddf45ef90f0e817ce98cd5c7d4f',
            s: '8931f137e1e09d58c68a572b5fc629d80c1d6edddc9f671fe1c63b1fa321252a',
            recoveryParam: 0,
          },
        },
      },
      {
        id: '23892fb0-0f7b-11ec-968e-09008debbed9',
        output: {
          '0x1dcc99E8Da20FF2455461B6b4Afd7283E554A2Db': '50.00000000',
        },
        input: {
          timestamp: 1630978215295,
          amount: '',
          address: '',
          publicKey: '',
          localPublicKey: '',
          recipient: '0x1dcc99E8Da20FF2455461B6b4Afd7283E554A2Db',
          signature: '',
        },
      },
    ],
    nonce: 64,
    difficulty: 7,
    blockSize: '1,133',
    transactionVolume: '52.00000000',
    blockReward: '50.00000000',
    feeReward: '0.00000000',
    blockchainHeight: 4,
    hashOfAllHashes: 'f2c2a3f535f5f454de471efe35ef031c4ec1790e3bab9ad1fd7d3ea582588c23',
  },
  {
    timestamp: 1630978215296,
    lastHash: '00728fe9b45d40a6a4d75187853291f729ff8047d7b68744d5a5378b6de29850',
    hash: '01bd05b3afc7331be50c77adf25ed8a159f8aee52efc93134703c5373f296d7c',
    transactions: [
      {
        id: '26ca50f0-0f7b-11ec-968e-09008debbed9',
        output: {
          '0x1dcc99E8Da20FF2455461B6b4Afd7283E554A2Db': '704.00000000',
          '0x86045b56bfeb1A35C6818081130BA0F789dc27c9': '3.00000000',
        },
        input: {
          timestamp: 1630978214783,
          amount: '707.00000000',
          address: '0x1dcc99E8Da20FF2455461B6b4Afd7283E554A2Db',
          publicKey:
            '04d4d9b0a09853a8d886360ae13bf5a25208e8c666982b5a0d3a80c2e91fb7fe6ec0c737cfeadac1ab8cdf67f5da723db7e124c45ccef07f10d53fe0b2103cb69f',
          localPublicKey:
            '04903a1dfd7d49ebb3d6f69968da1da9a267dea75a303eada48985cddd4197547ae706e45dd389be0f3a22fbf962a7420a902cc97877e52d84e73c18aa23990e05',
          signature: {
            r: '539141f01b52623a89c1a6fb56764d2917ba9fedf92373f58d1484d6fc42d5be',
            s: '100101e7ca5b5faf0d0037ee95c51d2deb270ed38f3d303f737399145052f364',
            recoveryParam: 1,
          },
        },
      },
      {
        id: '271870f0-0f7b-11ec-968e-09008debbed9',
        output: {
          '0x1dcc99E8Da20FF2455461B6b4Afd7283E554A2Db': '50.00000000',
        },
        input: {
          timestamp: 1630978215295,
          amount: '',
          address: '',
          publicKey: '',
          localPublicKey: '',
          recipient: '0x1dcc99E8Da20FF2455461B6b4Afd7283E554A2Db',
          signature: '',
        },
      },
    ],
    nonce: 22,
    difficulty: 6,
    blockSize: '1,133',
    transactionVolume: '53.00000000',
    blockReward: '50.00000000',
    feeReward: '0.00000000',
    blockchainHeight: 5,
    hashOfAllHashes: 'd78e916cfa852700cc0a16cbcddb11b27d473c289e1a45f4f54a600457a22909',
  },
];
