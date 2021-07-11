/*
 * # Kadocoin License
 *
 * Copyright (c) 2021 Adamu Muhammad Dankore
 * Distributed under the MIT software license, see the accompanying
 * file LICENSE or <http://www.opensource.org/licenses/mit-license.php>
 */
// MIT License
// Copyright (c) Adamu Muhammad Dankore
export default function costOfMessage({ message }: { message: string }): number {
  if (!message) return 0;
  return message.length;
}
