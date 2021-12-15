function cleanUpTransaction(transactions: any) {
  const items = [];
  for (let i = 0; i < transactions.length; i++) {
    const transaction = transactions[i];
    // ADD ID
    items.push(transaction.id);
    // ADD AMOUNT
    Object.values(transaction['output']).map(o => items.push(o));

    // ADD INPUT VALUES
    for (const key in transaction['input']) {
      if (Object.prototype.hasOwnProperty.call(transaction['input'], key)) {
        if (key == 'timestamp') items.push(transaction['input'][key]);
        if (key == 'amount') items.push(transaction['input'][key]);
        if (key == 'address') items.push(transaction['input'][key]);
        if (key == 'publicKey') items.push(transaction['input'][key]);
        if (key == 'publicKey') items.push(transaction['input'][key]);
      }
    }
  }

  return items;
}

const data = [
  {
    id: '73694f20-e7cf-11eb-96e5-61eb83113e1c',
    output: {
      '0x86045b56bfeb1A35C6818081130BA0F789dc27c9': '1420.00000000',
      '0xf13C09968D48271991018A956C49940c41eCb1c3': '30.00000000',
    },
    input: {
      timestamp: 1626616378314,
      amount: '1450.00000000',
      address: '0x86045b56bfeb1A35C6818081130BA0F789dc27c9',
      publicKey:
        '04a5bdca39766c537b433e266e4903f7638b33eee5d75002870f420a897655cf1ac22ef42c59b52c81f918dd12f1061ca98f70ad3897c1a97d036251ca0a0008ac',
      publicKey:
        '040e9d64d4ee0fa90efb8bd6c1a0b8509fe20be9371dddef1fa2acaf922c23a775dd191dc32f59f712bd1ea17ab9dd4378cd98bfd31355bf4b504f7c36857db2c3',
      signature: { r: '', s: '' },
    },
  },
];

console.log(cleanUpTransaction(data));
