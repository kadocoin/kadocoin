/*
 * # Kadocoin License
 *
 * Copyright (c) 2021 Adamu Muhammad Dankore
 * Distributed under the MIT software license, see the accompanying
 * file LICENSE or <http://www.opensource.org/licenses/mit-license.php>
 */
import Blockchain from '../blockchain';
import Block from '../blockchain/block';
import { sampleDataForTests } from '../config/constants';
import { MINE_RATE } from '../config/constants';

(function averageWork(): void {
  const blockchain = new Blockchain(),
    times: Array<number> = [];

  // ADD FIRST BLOCK
  blockchain.addBlock({ transactions: [sampleDataForTests] });
  console.log('first block', blockchain.chain[blockchain.chain.length - 1]);
  console.log({ MINE_RATE });

  let prevTimestamp: number,
    nextTimestamp: number,
    nextBlock: Block,
    timeDiff: number,
    average: number,
    prevDifficulty: number;

  for (let i = 0; i < 10000; i++) {
    prevTimestamp = blockchain.chain[blockchain.chain.length - 1].timestamp;
    prevDifficulty = blockchain.chain[blockchain.chain.length - 1].difficulty;

    blockchain.addBlock({ transactions: [sampleDataForTests] });
    nextBlock = blockchain.chain[blockchain.chain.length - 1];

    nextTimestamp = nextBlock.timestamp;
    timeDiff = nextTimestamp - prevTimestamp;

    times.push(timeDiff);

    average = times.reduce((total, num) => total + num) / times.length;

    console.log(
      `Time to mine block: ${timeDiff}ms. PrevDifficulty: ${prevDifficulty} Difficulty: ${nextBlock.difficulty}. Average time: ${average}ms. Iteration ${i}`
    );
  }
})();
