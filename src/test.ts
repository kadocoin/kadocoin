const transactionsPool = {
  'c899db80-e1c7-11eb-b60e-45c1d7bb1c6b': {
    id: 'c899db80-e1c7-11eb-b60e-45c1d7bb1c6b',
    output: {
      '0xC6d23c6703f33F5ad74E6E4fc17C1CE9397D4AAD': '900.00000000',
      '0xf13C09968D48271991018A956C49940c41eCb1c3': '100.00000000',
    },
    input: {
      timestamp: 1625953374521,
      amount: '1000.00000000',
      address: '0xC6d23c6703f33F5ad74E6E4fc17C1CE9397D4AAD',
      publicKey:
        '0460eeaa6a2393801ca90356bab01b6d206b9a431d8475f3ebff6999eef7199ad0b0f98e2aa354b24386b072553071dfe100574667584c11b518ea1e36ba959bb4',
      localPublicKey:
        '04070764cefcb44462372e290ecda15da6b92c81c4b06ec1153f9d4c0ba2a4e0251194a03c4f93737a16d78e5b49517f2b50eeaf2c3e9d1e86398fea8b8cd679c4',
      signature: {
        r: '68fcdeb460cfbd6109374616d13d0b264c4fe5265f8718e27fd999de128107e5',
        s: 'f75dc10ed9bac89f946fc9bfa33372cf52085562cf8a102eb5e220865e07972a',
        recoveryParam: 1,
      },
    },
  },
  'd487e770-e1c7-11eb-b60e-45c1d7bb1c6b': {
    id: 'd487e770-e1c7-11eb-b60e-45c1d7bb1c6b',
    output: {
      '0xC6d23c6703f33F5ad74E6E4fc17C1CE9397D4AAD': '800.00000000',
      '0xf13C09968D48271991018A956C49940c41eCb1c3': '100.00000000',
    },
    input: {
      timestamp: 1625953394535,
      amount: '900.00000000',
      address: '0xC6d23c6703f33F5ad74E6E4fc17C1CE9397D4AAD',
      publicKey:
        '0460eeaa6a2393801ca90356bab01b6d206b9a431d8475f3ebff6999eef7199ad0b0f98e2aa354b24386b072553071dfe100574667584c11b518ea1e36ba959bb4',
      localPublicKey:
        '04070764cefcb44462372e290ecda15da6b92c81c4b06ec1153f9d4c0ba2a4e0251194a03c4f93737a16d78e5b49517f2b50eeaf2c3e9d1e86398fea8b8cd679c4',
      signature: {
        r: '97427ca8e609cf491ece85075ca8055000d6dedb32d8c397e56ee9bab45a682f',
        s: '468f4649c0a12b31fb100a6b0f1f9f2c9895aea1ed3172de8f4b87d431f50f62',
        recoveryParam: 0,
      },
    },
  },
  'd9ad5910-e1c7-11eb-b60e-45c1d7bb1c6b': {
    id: 'd9ad5910-e1c7-11eb-b60e-45c1d7bb1c6b',
    output: {
      '0xC6d23c6703f33F5ad74E6E4fc17C1CE9397D4AAD': '600.00000000',
      '0xf13C09968D48271991018A956C49940c41eCb1c3': '100.00000000',
    },
    input: {
      timestamp: 1625953403169,
      amount: '900.00000000',
      address: '0xC6d23c6703f33F5ad74E6E4fc17C1CE9397D4AAD',
      publicKey:
        '0460eeaa6a2393801ca90356bab01b6d206b9a431d8475f3ebff6999eef7199ad0b0f98e2aa354b24386b072553071dfe100574667584c11b518ea1e36ba959bb4',
      localPublicKey:
        '04070764cefcb44462372e290ecda15da6b92c81c4b06ec1153f9d4c0ba2a4e0251194a03c4f93737a16d78e5b49517f2b50eeaf2c3e9d1e86398fea8b8cd679c4',
      signature: {
        r: '97427ca8e609cf491ece85075ca8055000d6dedb32d8c397e56ee9bab45a682f',
        s: '468f4649c0a12b31fb100a6b0f1f9f2c9895aea1ed3172de8f4b87d431f50f62',
        recoveryParam: 0,
      },
    },
  },
  'db86fb10-e1c7-11eb-b60e-45c1d7bb1c6b': {
    id: 'db86fb10-e1c7-11eb-b60e-45c1d7bb1c6b',
    output: {
      '0xC6d23c6703f33F5ad74E6E4fc17C1CE9397D4AAD': '500.00000000',
      '0xf13C09968D48271991018A956C49940c41eCb1c3': '100.00000000',
    },
    input: {
      timestamp: 1625953406273,
      amount: '900.00000000',
      address: '0xC6d23c6703f33F5ad74E6E4fc17C1CE9397D4AAD',
      publicKey:
        '0460eeaa6a2393801ca90356bab01b6d206b9a431d8475f3ebff6999eef7199ad0b0f98e2aa354b24386b072553071dfe100574667584c11b518ea1e36ba959bb4',
      localPublicKey:
        '04070764cefcb44462372e290ecda15da6b92c81c4b06ec1153f9d4c0ba2a4e0251194a03c4f93737a16d78e5b49517f2b50eeaf2c3e9d1e86398fea8b8cd679c4',
      signature: {
        r: '97427ca8e609cf491ece85075ca8055000d6dedb32d8c397e56ee9bab45a682f',
        s: '468f4649c0a12b31fb100a6b0f1f9f2c9895aea1ed3172de8f4b87d431f50f62',
        recoveryParam: 0,
      },
    },
  },
};

console.log(Object.values(transactionsPool));
const address = '0xC6d23c6703f33F5ad74E6E4fc17C1CE9397D4AAD';
const arr: Array<string> = [];

Object.values(transactionsPool).map(transaction => {
  for (const addr in transaction['output']) {
    if (addr == address) arr.push(transaction['output'][address]);
  }
});

console.log(arr.sort()[0]);
