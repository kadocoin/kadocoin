/*
 * # Kadocoin License
 *
 * Copyright (c) 2021 Adamu Muhammad Dankore
 * Distributed under the MIT software license, see the accompanying
 * file LICENSE or <http://www.opensource.org/licenses/mit-license.php>
 */

export default function isEmptyObject(obj: Record<string, any>): boolean {
  return Object.keys(obj).length === 0;
}
