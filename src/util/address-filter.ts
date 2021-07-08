/*
 * Copyright (c) 2021 Adamu Muhammad Dankore
 * Distributed under the MIT software license, see the accompanying
 * file LICENSE or http://www.opensource.org/licenses/mit-license.php.
 */
export function filterAddress(mixedAddress: string): string {
  // param example - "msg-fee-0xC6d23c6703f33F5ad74E6E4fc17C1CE9397D4AAD"

  if (mixedAddress.substring(0, 8) == 'msg-fee-') return mixedAddress.split('msg-fee-')[1];
  if (mixedAddress.substring(0, 9) == 'send-fee-') return mixedAddress.split('send-fee-')[1];
}
