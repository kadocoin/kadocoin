/*
 * # Kadocoin License
 *
 * Copyright (c) 2021 Adamu Muhammad Dankore
 * Distributed under the MIT software license, see the accompanying
 * file LICENSE or <http://www.opensource.org/licenses/mit-license.php>
 */
import { TTransactions } from '../types';

export function transactionVolume({ transactions }: { transactions: TTransactions }): string {
  let totalTransactionsAmount = 0;

  for (let i = 0; i < transactions.length; i++) {
    const transaction = transactions[i];

    for (const prop in transaction['output']) {
      if (prop !== transaction['input'].address /** sender address*/)
        totalTransactionsAmount += Number(transaction['output'][prop]);
    }
  }

  return totalTransactionsAmount.toFixed(8);
}

export function totalMsgReward({ transactions }: { transactions: TTransactions }): string {
  let totalMsgReward = 0;

  for (let i = 0; i < transactions.length; i++) {
    const transaction = transactions[i];

    for (const prop in transaction['output']) {
      if (
        prop.substring(0, 8) ==
        'msg-fee-' /** example - "msg-fee-0xC6d23c6703f33F5ad74E6E4fc17C1CE9397D4AAD" */
      )
        totalMsgReward += Number(transaction['output'][prop]);
    }
  }

  return totalMsgReward.toFixed(8);
}

export function totalFeeReward({ transactions }: { transactions: TTransactions }): string {
  let totalFeeReward = 0;

  for (let i = 0; i < transactions.length; i++) {
    const transaction = transactions[i];

    for (const prop in transaction['input']) {
      if (prop === 'sendFee') totalFeeReward += Number(transaction['input'][prop]);
    }
  }

  return totalFeeReward.toFixed(8);
}

export function calcOutputTotal(output: { [key: string]: string }): string {
  let total = 0;

  const arr = Object.values(output);

  for (let i = 0; i < arr.length; i++) {
    const element = arr[i];

    total += Number(element);
  }

  return total.toFixed(8);
}
