/*
 * # Kadocoin License
 *
 * Copyright (c) 2021 Adamu Muhammad Dankore
 * Distributed under the MIT software license, see the accompanying
 * file LICENSE or <http://www.opensource.org/licenses/mit-license.php>
 */

export default function costOfMessage({ message }: { message: string }): string {
  if (!message) return (0).toFixed(8);
  return message.length.toFixed(8);
}
