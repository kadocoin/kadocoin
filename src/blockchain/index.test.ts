import { GENESIS_DATA, MINE_RATE } from "../config/constants";
import cryptoHash from "../util/crypto-hash";
import Block from "./block";
import hexToBinary from "hex-to-bin";

describe("Block", () => {
  const timestamp = 123456;
  const lastHash = "foo-last-hash";
  const hash = "foo-hash";
  const data = [
    {
      id: "2d5791f0-d9af-11eb-ac13-099d1d20fcfc",
      output: {
        "0xC6d23c6703f33F5ad74E6E4fc17C1CE9397D4AAD": "770.00000000",
        "0x86045b56bfeb1A35C6818081130BA0F789dc27c9": "230.00000000",
      },
      input: {
        timestamp: 1625063196815,
        amount: "1000.00000000",
        address: "0xC6d23c6703f33F5ad74E6E4fc17C1CE9397D4AAD",
        publicKey:
          "0460eeaa6a2393801ca90356bab01b6d206b9a431d8475f3ebff6999eef7199ad0b0f98e2aa354b24386b072553071dfe100574667584c11b518ea1e36ba959bb4",
        localPublicKey:
          "04b9c0f354c36f7df448ed4125480e84aad425b1851e1736c90d08835e4a77e9e7d33bfda4df16b8bf13d933592942aafdeefc2dac7450c833dbdbf445abe258dc",
        signature: "signature",
      },
    },
  ];
  const nonce = 1;
  const difficulty = 1;

  const block = new Block({
    timestamp,
    lastHash,
    hash,
    data,
    nonce,
    difficulty,
  });

  it("has a timestamp, lastHash, hash, and data property.", () => {
    expect(block.timestamp).toEqual(timestamp);
    expect(block.lastHash).toEqual(lastHash);
    expect(block.hash).toEqual(hash);
    expect(block.data).toEqual(data);
    expect(block.nonce).toEqual(nonce);
    expect(block.difficulty).toEqual(difficulty);
  });

  describe("genesis()", () => {
    const genesisBlock = Block.genesis();

    it("returns a Block instance", () => {
      expect(genesisBlock instanceof Block).toBe(true);
    });

    it("returns the genesis data", () => {
      expect(genesisBlock).toEqual(GENESIS_DATA);
    });
  });

  describe("minedBlock", () => {
    const lastBlock = Block.genesis();
    const data = ["mined data"];
    const minedBlock = Block.minedBlock({ lastBlock, data });

    it("returns a Block instance", () => {
      expect(minedBlock instanceof Block).toBe(true);
    });

    it("sets the `lastHash` to be the `hash` of the lastBlock", () => {
      expect(minedBlock.lastHash).toEqual(lastBlock.hash);
    });

    it("sets the `data`", () => {
      expect(minedBlock.data).toEqual(data);
    });

    it("sets a `timestamp`", () => {
      expect(minedBlock.timestamp).not.toEqual(undefined);
    });

    it("creates a SHA-256 `hash` based on the proper inputs", () => {
      expect(minedBlock.hash).toEqual(
        cryptoHash(
          minedBlock.timestamp,
          minedBlock.nonce,
          minedBlock.difficulty,
          lastBlock.hash,
          data
        )
      );
    });

    it("sets of `hash` that matches the difficulty criteria", () => {
      expect(
        hexToBinary(minedBlock.hash).substring(0, minedBlock.difficulty)
      ).toEqual("0".repeat(minedBlock.difficulty));
    });

    it("adjusts the difficulty", () => {
      const possibleResults = [
        lastBlock.difficulty + 1,
        lastBlock.difficulty - 1,
      ];
      expect(possibleResults.includes(minedBlock.difficulty)).toBe(true);
    });
  });

  describe("adjustDifficulty()", () => {
    it("raises the difficulty for a quickly mined block", () => {
      expect(
        Block.adjustDifficulty({
          originalBlock: block,
          timestamp: block.timestamp + MINE_RATE - 100,
        })
      ).toEqual(block.difficulty + 1);
    });
    it("lowers the difficulty for a slowly mined block", () => {
      expect(
        Block.adjustDifficulty({
          originalBlock: block,
          timestamp: block.timestamp + MINE_RATE + 100,
        })
      ).toEqual(block.difficulty - 1);
    });

    it("has a lower limit of 1", () => {
      block.difficulty = -1;
      expect(
        Block.adjustDifficulty({ originalBlock: block, timestamp })
      ).toEqual(1);
    });
  });

  // END BLOCK CLASS TEST SUITE
});
