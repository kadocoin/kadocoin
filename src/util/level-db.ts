// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore
import level from 'level'; // SOURCE => https://github.com/Level/level
// import { balancesStorageFolder } from '../config/constants';
const balancesDB = level('balancesDB');
export default balancesDB;
// // 1) Create our database, supply location and options.
// //    This will create or open the underlying store.
// export default function levelDB(): void {

//   // 2) Put a key & value
//   db.put('name', 'Level', function (err: any) {
//     if (err) return console.log('Ooops!', err); // some kind of I/O error

//     // 3) Fetch by key
//     db.get('name', function (err: any, value: string) {
//       if (err) return console.log('Ooops!', err); // likely the key was not found

//       // Ta da!
//       console.log('name=' + value);
//     });
//   });
// }
