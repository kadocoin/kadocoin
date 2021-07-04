const transactions = [
  {
    id: '5ea73580-dc6b-11eb-bba4-c3cbcebe08d0',
    output: {
      '0xC6d23c6703f33F5ad74E6E4fc17C1CE9397D4AAD': '770.00000000',
      '0x86045b56bfeb1A35C6818081130BA0F789dc27c9': '230.00000000',
    },
    input: {
      timestamp: 1625363927256,
      amount: '1000.00000000',
      address: '0xC6d23c6703f33F5ad74E6E4fc17C1CE9397D4AAD',
      publicKey:
        '0460eeaa6a2393801ca90356bab01b6d206b9a431d8475f3ebff6999eef7199ad0b0f98e2aa354b24386b072553071dfe100574667584c11b518ea1e36ba959bb4',
      localPublicKey:
        '044bd391b5068434770ab81d20c361c490ded79417a0f34fd3fa9a4adc8703c04a3fb2fc7a4f5d5b7527a9ce3ac2133248657e1701d9ada9747d9aedae67c856bc',
      signature: {
        r: 'bd4b9594ceb36994dac3a35f00a5ac8e3a90d7d9828df128df6919683a7a62c4',
        s: 'e362e551a71960f61b573f0b1daf1d61b21cb4a947ef8ccd2ec76539e49ac8ca',
        recoveryParam: 0,
      },
    },
  },
  {
    id: '6914bbf0-dc6b-11eb-bba4-c3cbcebe08d0',
    output: {
      '0x86045b56bfeb1A35C6818081130BA0F789dc27c9': '50.00000000',
    },
    input: {
      timestamp: 1624848894788,
      amount: '50.00000000',
      address: '',
      publicKey: '',
      localPublicKey: '',
      recipient: '0x86045b56bfeb1A35C6818081130BA0F789dc27c9',
      signature: '',
      message: '*Mining Reward Transaction*',
    },
  },
];

const senderAddress = '0xC6d23c6703f33F5ad74E6E4fc17C1CE9397D4AAD';

function transactionVolume(transactions, senderAddress) {
  let totalTransactionsAmount = 0;
  for (let i = 0; i < transactions.length; i++) {
    const transaction = transactions[i];
    

    for (let prop in transaction['output']) {
      if(prop !== senderAddress) totalTransactionsAmount += Number(transaction['output'][prop]); 
    }
  }

  return totalTransactionsAmount.toFixed(8);
}

console.log(transactionVolume(transactions, senderAddress));
