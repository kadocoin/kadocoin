/*
 * Copyright (c) 2021 Adamu Muhammad Dankore
 * Distributed under the MIT software license, see the accompanying
 * file LICENSE or http://www.opensource.org/licenses/mit-license.php.
 */
import crypto from 'crypto';

const cryptoHash = (...inputs: any[]): string => {
  const hash = crypto.createHash('sha256');

  hash.update(
    inputs
      .map(input => JSON.stringify(input))
      .sort()
      .join(' ')
  );

  return hash.digest('hex');
};

export default cryptoHash;
