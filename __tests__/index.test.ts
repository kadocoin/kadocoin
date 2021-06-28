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
  });
  // END OF WALLET TEST SUITE
});
