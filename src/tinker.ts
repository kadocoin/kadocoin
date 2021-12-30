import Block from './blockchain/block';
import LevelDB from './db';

const sampleBlocks = [
  {
    timestamp: 1630978190500,
    lastHash: '*None*',
    hash: '006184d4751c4880ef0d732b76f8d46a17d395fbc9f0488a41f64f48b1468918',
    transactions: [
      {
        id: '1784b590-0f7b-11ec-968e-09008debbed9',
        output: {
          '0x1dcc99E8Da20FF2455461B6b4Afd7283E554A2Db': '2000.00000000',
          '0x86045b56bfeb1A35C6818081130BA0F789dc27c9': '40.00000000',
        },
        input: {
          timestamp: 1630978189162,
          amount: '1000.00000000',
          address: '0x1dcc99E8Da20FF2455461B6b4Afd7283E554A2Db',
          publicKey:
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
          '0x1dcc99E8Da20FF2455461B6b4Afd7283E554A2Db-adamu': '50.00000000',
        },
        input: {
          timestamp: 1630978215295,
          amount: '',
          address: '',
          publicKey: '',
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
          '0x1dcc99E8Da20FF2455461B6b4Afd7283E554A2Db-adamu': '50.00000000',
        },
        input: {
          timestamp: 1630978215295,
          amount: '',
          address: '',
          publicKey: '',
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
];

const leveldb = new LevelDB();
(async function () {
  await leveldb.addOrUpdateBal(sampleBlocks as unknown as Block[]);
})();

// leveldb.getAllKeysAndValues();

setInterval(() => leveldb.getAllKeysAndValues(), 10000);
