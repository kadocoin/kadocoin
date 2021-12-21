import { TTransactionChild } from './types';
import size from './util/size';

const txn = {
  '63694f20-e7cf-11eb-96e5-61eb83113e1c': {
    id: '63694f20-e7cf-11eb-96e5-61eb83113e1c',
    output: {
      '0x86045b56bfeb1A35C6818081130BA0F789dc27c9': '1420.00000000',
      '0xf13C09968D48271991018A956C49940c41eCb1c3': '30.00000000',
    },
    input: {
      timestamp: 1626616378314,
      amount: '10.00000000',
      address: '0x86045b56bfeb1A35C6818081130BA0F789dc27c9',
      sendFee: '0.00000000',
      publicKey:
        '04a5bdca39766c537b433e266e4903f7638b33eee5d75002870f420a897655cf1ac22ef42c59b52c81f918dd12f1061ca98f70ad3897c1a97d036251ca0a0008ac',
      signature: '',
    },
  },
  '73694f20-e7cf-11eb-96e5-61eb83133e1c': {
    id: '73694f20-e7cf-11eb-96e5-61eb83133e1c',
    output: {
      '0x86045b56bfeb1A35C6818081130BA0F789dc27c9': '1420.00000000',
      '0xf13C09968D48271991018A956C49940c41eCb1c3': '30.00000000',
    },
    input: {
      timestamp: 1626616378314,
      amount: '1450.00000000',
      address: '0x86045b56bfeb1A35C6818081130BA0F789dc27c9',
      sendFee: '0.00000600',
      publicKey:
        '04a5bdca39766c537b433e266e4903f7638b33eee5d75002870f420a897655cf1ac22ef42c59b52c81f918dd12f1061ca98f70ad3897c1a97d036251ca0a0008ac',
      signature: '',
    },
  },
  'c8231190-607e-11ec-af95-1f32513a53e3': {
    id: 'c8231190-607e-11ec-af95-1f32513a53e3',
    output: {
      '0x4Ff299F604391989b36d13D24Ce4247b0EC7964a': '1821.10986000',
      '0x86045b56bfeb1A35C6818081130BA0F789dc27c9': '2.00000000',
    },
    input: {
      timestamp: 1639885818153,
      amount: '1823.10986000',
      sendFee: '0.00069000',
      address: '0x4Ff299F604391989b36d13D24Ce4247b0EC7964a',
      publicKey:
        '041adef30a4544272c81cf9589d5a1abd2770c9982114d7d3ccc6a712882372aefc6dc09e17ac56294e17cb78c893b0fcde35507ddcd7b718178016c5fb69b465b',
      signature: '',
      message: 'www',
    },
  },
};

function setTransactionsAccordingToSendFee(
  transactions: Record<string, TTransactionChild>
): Map<string, TTransactionChild> {
  const fee_bucket = new Map();
  const unit = 1024 * 1024;

  for (const txn in transactions) {
    const sendFee = transactions[txn]['input']['sendFee'] || 0;

    const size_of_txn_in_bytes = size(transactions[txn]);
    const weight_per_fee = Math.ceil((Number(sendFee) * unit) / Number(size_of_txn_in_bytes));

    if (fee_bucket.has(weight_per_fee)) {
      fee_bucket.get(weight_per_fee).push(transactions[txn]);
    } else {
      fee_bucket.set(`${weight_per_fee}_${transactions[txn]['id']}`, [transactions[txn]]);
    }
  }

  return fee_bucket;
}

const testObj = setTransactionsAccordingToSendFee(txn);
console.log(testObj);

function sort_fee_bucket(
  fee_bucket: Map<string, TTransactionChild>
): Map<string, TTransactionChild> {
  const keys_reversed = Array.from(fee_bucket.keys()).sort().reverse();
  const sorted = new Map();

  for (let i = 0; i < keys_reversed.length; i++) {
    const key = keys_reversed[i];
    sorted.set(key, fee_bucket.get(key));
  }

  return sorted;
}

const sorted_fee_bucket = sort_fee_bucket(testObj);
console.log('---------');
console.log(sorted_fee_bucket);

function getBucketsOfMineableTransactions(
  bucket: Map<string, TTransactionChild>
): Map<string, TTransactionChild> {
  let weight = 0;
  const max_weight = 12500;
  const txn_to_mine = new Map();

  bucket.forEach((transactions: any) => {
    for (let i = 0; i < transactions.length; i++) {
      if (weight > max_weight) return console.log('I now have enough to mine');

      const transaction = transactions[i];

      const weight_of_txn = size(transaction);
      console.log({ weight_of_txn });
      txn_to_mine.set(transaction['id'], transaction);

      weight += Number(weight_of_txn);
    }
  });
  // console.log(txn_to_mine);
  return txn_to_mine;
}

console.log(getBucketsOfMineableTransactions(sorted_fee_bucket));
// getBucketsOfMineableTransactions(sorted_fee_bucket);

// function checkSameObjKey(map: any, key: any) {
//   const keys = map.keys();
//   let anotherKey;

//   while ((anotherKey = keys.next().value)) {
//     // YOUR COMPARISON HERE
//     if (key.id == anotherKey.id) return true;
//   }

//   return false;
// }
