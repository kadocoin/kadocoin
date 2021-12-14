/*
 * # Kadocoin License
 *
 * Copyright (c) 2021 Adamu Muhammad Dankore
 * Distributed under the MIT software license, see the accompanying
 * file LICENSE or <http://www.opensource.org/licenses/mit-license.php>
 */
import Transaction from '../wallet/transaction';

export default function isEmptyObject(obj: Record<string, Transaction>): boolean {
  return Object.keys(obj).length === 0;
}
