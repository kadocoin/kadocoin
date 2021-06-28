import Wallet from "../src/wallet/index";

describe("Wallet", () => {
  let wallet: Wallet;

  beforeEach(() => {
    wallet = new Wallet();
  });

  it("has a `balance`", () => {
    expect(wallet).toHaveProperty("balance");
  });

  // END OF WALLET
});
