import Blockchain from "../src/blockchain";
import { STARTING_BALANCE } from "../src/config/constants";
import verifySignature from "../src/util/verifySignature";
import Wallet from "../src/wallet/index";
import Transaction from "../src/wallet/transaction";

describe("Wallet", () => {
  let wallet: Wallet;

  beforeEach(() => {
    wallet = new Wallet();
  });

  /**
   * WALLET CLASS PROPERTIES TESTS
   */

  it("has a `balance`", () => expect(wallet).toHaveProperty("balance"));
  it("has a `publicKey`", () => expect(wallet).toHaveProperty("publicKey"));
  it("has an `address`", () => expect(wallet).toHaveProperty("address"));
  it("has an `keyPair`", () => expect(wallet).toHaveProperty("keyPair"));

  /**
   * WALLET CLASS METHODS TESTS
   */

  describe("signing data", () => {
    const data = "kadocoin";

    it("verifies a signature", () =>
      expect(
        verifySignature({
          publicKey: wallet.publicKey,
          data: data,
          signature: wallet.sign(data),
        })
      ).toBe(true));

    it("does not verify an invalid signature", () =>
      expect(
        verifySignature({
          publicKey: wallet.publicKey,
          data: data,
          signature: new Wallet().sign(data),
        })
      ).toBe(false));
  });

  describe("createTransaction()", () => {
    describe("and the amount exceeds the balance", () => {
      it("throws an error", () =>
        expect(() =>
          wallet.createTransaction({ amount: 1001, recipient: "anyone" })
        ).toThrow("Insufficient balance"));
    });

    describe("and the amount is valid", () => {
      let transaction: Transaction, amount: number, recipient: string;

      beforeEach(() => {
        amount = 50;
        recipient = "kadocoin user address";
        transaction = wallet.createTransaction({ amount, recipient });
      });

      it("creates an instance of `Transaction`", () => {
        expect(transaction instanceof Transaction).toBe(true);
      });

      it("matches the transaction input `localPublicKey` with the wallet publicKey", () => {
        expect(transaction.input.localPublicKey).toEqual(wallet.publicKey);
      });

      it("outputs the amount to the recipient", () => {
        expect(transaction.output[recipient]).toEqual(amount.toFixed(8));
      });
    });

    describe("and a chain is passed", () => {
      it("calls `Wallet.calculateBalance()`", () => {
        const calculateBalanceMock = jest.fn();
        const originalCalculateBalance = Wallet.calculateBalance;

        Wallet.calculateBalance = calculateBalanceMock;

        wallet.createTransaction({
          recipient: "kadocoin user address",
          amount: 10,
          chain: new Blockchain().chain,
        });

        expect(calculateBalanceMock).toHaveBeenCalled();

        Wallet.calculateBalance = originalCalculateBalance;
      });
    });
    // END OF createTransaction()
  });

  describe("calculateBalance()", () => {
    let blockchain: Blockchain;

    beforeEach(() => {
      blockchain = new Blockchain();
    });

    describe("and there are outputs for the wallet", () => {
      let transactionOne: Transaction, transactionTwo: Transaction;

      beforeEach(() => {
        transactionOne = new Wallet().createTransaction({
          recipient: wallet.address,
          amount: 50,
        });

        transactionTwo = new Wallet().createTransaction({
          recipient: wallet.address,
          amount: 60,
        });

        blockchain.addBlock({ data: [transactionOne, transactionTwo] });
      });

      it("adds the sum of all outputs to the wallet balance", () => {
        expect(
          Wallet.calculateBalance({
            chain: blockchain.chain,
            address: wallet.address,
          })
        ).toEqual(
          (
            STARTING_BALANCE +
            Number(transactionOne.output[wallet.address]) +
            Number(transactionTwo.output[wallet.address])
          ).toFixed(8)
        );
      });

      // describe("and the wallet has made a transaction", () => {
      //   let recentTransaction;

      //   beforeEach(() => {
      //     recentTransaction = wallet.createTransaction({
      //       recipient: "Kado123",
      //       amount: 30,
      //       address: "sender",
      //     });

      //     blockchain.addBlock({ data: [recentTransaction] });
      //   });

      //   it("returns the output amount of the recent transaction", () => {
      //     expect(
      //       Wallet.calculateBalance({
      //         chain: blockchain.chain,
      //         address: wallet.address,
      //       })
      //     ).toEqual(wallet);
      //   });

      //   describe("and there are outputs next to and after the recent transaction", () => {
      //     let sampleBlockTransaction, nextBlockTransaction;

      //     beforeEach(() => {
      //       recentTransaction = wallet.createTransaction({
      //         recipient: "Kado after",
      //         amount: 60,
      //       });
      //       sampleBlockTransaction = Transaction.rewardTransaction({
      //         minerPublicKey: wallet.publicKey,
      //       });

      //       blockchain.addBlock({
      //         data: [recentTransaction, sampleBlockTransaction],
      //       });

      //       nextBlockTransaction = new Wallet().createTransaction({
      //         recipient: wallet.publicKey,
      //         amount: 75,
      //       });

      //       blockchain.addBlock({ data: [nextBlockTransaction] });
      //     });

      //     it("includes the output amounts in the returned balance", () => {
      //       expect(
      //         Wallet.calculateBalance({
      //           chain: blockchain.chain,
      //           address: wallet.publicKey,
      //         })
      //       ).toEqual(
      //         recentTransaction.output[wallet.publicKey] +
      //         // sampleBlockTransaction.output[wallet.publicKey] +
      //         nextBlockTransaction.output[wallet.publicKey]
      //       );
      //     });
      //   });
      // });
    });
  });
  // END OF WALLET TEST SUITE
});
