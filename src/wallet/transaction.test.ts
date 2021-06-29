import { STARTING_BALANCE } from "../config/constants";
import { ITransactionClassParams } from "../types";
import verifySignature from "../util/verifySignature";
import Wallet from ".";
import Transaction from "./transaction";

describe("Transaction", () => {
  let transaction: Transaction | ITransactionClassParams,
    senderWallet: Wallet,
    recipient: string,
    amount: number,
    localWallet: Wallet;

  beforeEach(() => {
    senderWallet = new Wallet();
    localWallet = new Wallet();
    recipient = "kadocoin-recipient-address";
    amount = 500;
    transaction = new Transaction({
      amount,
      recipient,
      address: senderWallet.address,
      publicKey: senderWallet.publicKey,
      localWallet,
      balance: STARTING_BALANCE,
    });
  });

  it("has an `id` property", () => expect(transaction).toHaveProperty("id"));

  describe("output", () => {
    it("has an `output` property", () =>
      expect(transaction).toHaveProperty("output"));

    it("outputs the amount to the recipient", () =>
      expect(transaction.output[recipient]).toEqual(amount.toFixed(8)));

    it("outputs the remaining balance for the `senderWallet`", () => {
      expect(Number(transaction.output[senderWallet.address])).toEqual(
        Number(senderWallet.balance) - amount
      );
    });

    describe("input", () => {
      it("has an `input` property", () =>
        expect(transaction).toHaveProperty("input"));

      it("has a `timestamp` property in the input", () =>
        expect(transaction.input).toHaveProperty("timestamp"));
    });

    it("sets the `amount` to the `senderWallet` balance", () =>
      expect((transaction.input.amount as number).toFixed(8)).toEqual(
        senderWallet.balance
      ));

    it("sets the `address` to the `senderWallet` address", () =>
      expect(transaction.input.address).toEqual(senderWallet.address));

    it("signs the input", () =>
      expect(
        verifySignature({
          publicKey: localWallet.publicKey,
          data: transaction.output,
          signature: transaction.input.signature,
        })
      ).toBe(true));

    // END OUTPUT
  });

  describe("validTransaction()", () => {
    let errorMock;

    beforeEach(() => {
      errorMock = jest.fn();
      global.console.error = errorMock;
    });

    describe("when the transaction is valid", () => {
      it("returns true", () =>
        expect(Transaction.validTransaction(transaction)).toBe(true));
    });
  });

  // END CLASS TRANSACTION SUITE TESTS
});
