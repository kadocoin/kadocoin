import Blockchain from "./blockchain";
import Block from "./blockchain/block";

(function averageWork(): void {
  const blockchain = new Blockchain(),
    times: Array<number> = [];

  // ADD FIRST BLOCK
  blockchain.addBlock({ data: ["first-block-data"] });
  console.log("first block", blockchain.chain[blockchain.chain.length - 1]);

  let prevTimestamp: number,
    nextTimestamp: number,
    nextBlock: Block,
    timeDiff: number,
    average: number;

  for (let i = 0; i < 10000; i++) {
    prevTimestamp = blockchain.chain[blockchain.chain.length - 1].timestamp;

    blockchain.addBlock({ data: [`block ${i}`] });
    nextBlock = blockchain.chain[blockchain.chain.length - 1];

    nextTimestamp = nextBlock.timestamp;
    timeDiff = nextTimestamp - prevTimestamp;

    times.push(timeDiff);

    average = times.reduce((total, num) => total + num) / times.length;

    console.log(
      `Time to mine block: ${timeDiff}ms. Difficulty: ${nextBlock.difficulty}. Average time: ${average}ms. iteration ${i}`
    );
  }
})();
