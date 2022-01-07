// import { rmSync } from 'fs';
// import { balancesStorageFolder } from './config/constants';

// const res = rmSync('test.js', { force: true });

import LevelDB from './db';
const leveldb = new LevelDB();

(async function () {
  leveldb.getAllKeysAndValues(leveldb.balancesDB);
})();

// const sampleBlocks = [
//   {
//     timestamp: 1630978190500,
//     lastHash: '*None*',
//     hash: '006184d4751c4880ef0d732b76f8d46a17d395fbc9f0488a41f64f48b1468918',
//     transactions: [
//       {
//         id: '1784b590-0f7b-11ec-968e-09008debbed9',
//         output: {
//           '0x1dcc99E8Da20FF2455461B6b4Afd7283E554A2Db-2': '0.00000000',
//           '0x86045b56bfeb1A35C6818081130BA0F789dc27c9-2': '40.00000000',
//         },
//         input: {
//           timestamp: 1630978189162,
//           amount: '1000.00000000',
//           address: '0x1dcc99E8Da20FF2455461B6b4Afd7283E554A2Db',
//           publicKey:
//             '04903a1dfd7d49ebb3d6f69968da1da9a267dea75a303eada48985cddd4197547ae706e45dd389be0f3a22fbf962a7420a902cc97877e52d84e73c18aa23990e05',
//           signature: {
//             r: 'da0f4b658758032fa567e753d5202491caaacc285af17c83c3d2bb4407ac02a9',
//             s: '187c538ddcd3fb647fc065e7d95cc0653bcecaa6862f28d6ce77d714078b67ec',
//             recoveryParam: 1,
//           },
//         },
//       },
//       {
//         id: '184e4720-0f7b-11ec-968e-09008debbed9',
//         output: {
//           '0x1dcc99E8Da20FF2455461B6b4Afd7283E554A2Db-2-3': '50.00000000',
//         },
//         input: {
//           timestamp: 1630978215295,
//           amount: '',
//           address: '',
//           publicKey: '',
//           recipient: '0x1dcc99E8Da20FF2455461B6b4Afd7283E554A2Db',
//           signature: '',
//         },
//       },
//     ],
//     nonce: 775,
//     difficulty: 9,
//     blockSize: '1,078',
//     transactionVolume: '90.00000000',
//     blockReward: '50.00000000',
//     feeReward: '0.00000000',
//     blockchainHeight: 6,
//     hashOfAllHashes: 'c8013ff364db13877c33be317e437c31d07841bc52be28dc5a7a256d54cb0359',
//   },
//   {
//     timestamp: 1630978190500,
//     lastHash: '*None*',
//     hash: '006184d4751c4880ef0d732b76f8d46a17d395fbc9f0488a41f64f48b1468918',
//     transactions: [
//       {
//         id: '1784b590-0f7b-11ec-968e-09008debbed9',
//         output: {
//           '0x1dcc99E8Da20FF2455461B6b4Afd7283E554A2Db-2': '0.00000000',
//           '0x86045b56bfeb1A35C6818081130BA0F789dc27c9-2': '40.00000000',
//         },
//         input: {
//           timestamp: 1630978189162,
//           amount: '1000.00000000',
//           address: '0x1dcc99E8Da20FF2455461B6b4Afd7283E554A2Db',
//           publicKey:
//             '04903a1dfd7d49ebb3d6f69968da1da9a267dea75a303eada48985cddd4197547ae706e45dd389be0f3a22fbf962a7420a902cc97877e52d84e73c18aa23990e05',
//           signature: {
//             r: 'da0f4b658758032fa567e753d5202491caaacc285af17c83c3d2bb4407ac02a9',
//             s: '187c538ddcd3fb647fc065e7d95cc0653bcecaa6862f28d6ce77d714078b67ec',
//             recoveryParam: 1,
//           },
//         },
//       },
//       {
//         id: '184e4720-0f7b-11ec-968e-09008debbed9',
//         output: {
//           '0x1dcc99E8Da20FF2455461B6b4Afd7283E554A2Db-2-3': '50.00000000',
//         },
//         input: {
//           timestamp: 1630978215295,
//           amount: '',
//           address: '',
//           publicKey: '',
//           recipient: '0x1dcc99E8Da20FF2455461B6b4Afd7283E554A2Db',
//           signature: '',
//         },
//       },
//     ],
//     nonce: 775,
//     difficulty: 9,
//     blockSize: '1,078',
//     transactionVolume: '90.00000000',
//     blockReward: '50.00000000',
//     feeReward: '0.00000000',
//     blockchainHeight: 2,
//     hashOfAllHashes: 'c8013ff364db13877c33be317e437c31d07841bc52be28dc5a7a256d54cb0359',
//   },
// ];

// try {
//   leveldb.getBestBlockchainHeight().then(data => console.log({ data }));
// } catch (error) {
//   console.log({ error });
// }

// leveldb.getAllKeysAndValues();
// function dec2bin(dec: number) {
//   return (dec >>> 0).toString(2);
// }

// console.log(dec2bin(2))

// (async function () {
//   await leveldb.addOrUpdateBal(sampleBlocks as unknown[] as Block[]);
// })();

// const ops = [
//   { key: 'a', value: 'Yuri Irsenovich Kim' },
//   { key: 'b', value: '16 February 1941' },
//   { key: 'c', value: 'Kim Young-sook' },
//   { key: 'd', value: 'Clown' },
// ];

// ops.forEach(data => leveldb.balancesDB.put(data.key, data.value, err => console.log(err)));

// leveldb.balancesDB.put('d', 'Hello from Kado Village!!!', err => console.log(err));

// leveldb.balancesDB
//   .createReadStream({ reverse: true, keys: true, values: true })
//   .on('data', (data: { key: string; value: any }) => console.log({ data }));

// setTimeout(() => leveldb.getAllKeysAndValues(), 10000);
