import Wallet from "../src/wallet";
import Transaction from "../src/wallet/transaction";
import TransactionPool from "../src/wallet/transaction-pool";

describe("TransactionPool", () => {
  let transactionPool: TransactionPool, transaction: any, senderWallet: Wallet;

  beforeAll(() => {
    senderWallet = new Wallet();
    transactionPool = new TransactionPool();
    transaction = new Transaction({
      address: senderWallet.address,
      recipient: "someone",
      amount: 50,
      localWallet: new Wallet(),
    });
  });

  describe("setTransaction()", () => {
    it("adds a transaction", () => {
      transactionPool.setTransaction(transaction);

      expect(transactionPool.transactionMap[transaction.id]).toBe(transaction);
    });
  });

  describe("existingTransaction()", () => {
    it("returns an existing transaction given an input address", () => {
      transactionPool.setTransaction(transaction);

      expect(
        transactionPool.existingTransactionPool({
          inputAddress: senderWallet.address,
        })
      ).toBe(transaction);
    });
  });

  describe("validTransaction", () => {
    let validTransactions: Array<Transaction>, errorMock: jest.Mock<any, any>;
    const localWallet = new Wallet();

    beforeEach(() => {
      validTransactions = [];
      errorMock = jest.fn();
      global.console.error = errorMock;

      for (let i = 0; i < 10; i++) {
        transaction = new Transaction({
          publicKey: senderWallet.publicKey,
          address: senderWallet.address,
          localWallet: localWallet,
          recipient: "someone",
          amount: 30,
          balance: senderWallet.balance,
        });

        if (i % 3 === 0) {
          transaction.input.amount = 999999;
        } else if (i % 3 === 1) {
          transaction.input.signature = new Wallet().sign("kado");
        } else {
          validTransactions.push(transaction);
        }

        transactionPool.setTransaction(transaction);
      }
    });

    it("returns valid transaction", () => {
      expect(transactionPool.validTransactions()).toEqual(validTransactions);
    });
  });
});
