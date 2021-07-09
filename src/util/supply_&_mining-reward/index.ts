class Mining_Reward {
  private chainLength: number;
  public MINING_REWARD: string;
  public COINS_IN_CIRCULATION: string;

  constructor({ chainLength }: { chainLength: number }) {
    this.chainLength = chainLength;
    this.MINING_REWARD = this.calc().MINING_REWARD;
    this.COINS_IN_CIRCULATION = this.calc().supply;
  }

  private calc(): { MINING_REWARD: string; supply: string } {
    // IT TAKES THIS NUMBER OF BLOCKS IN THE BLOCKCHAIN TO GET 500,000,000 KADOCOINS - FIVE HUNDRED MILLION
    // BEYOND THAT NUMBER, THE NUMBER OF KADOCOINS WON'T GO BEYOND 500,000,000
    if (this.chainLength >= Number('169,999,999'.replace(/,/g, '')))
      return { MINING_REWARD: '0', supply: '500,000,000' };

    let reward = 50,
      supply = 0;
    const y = Number('5,000,000'.replace(/,/g, '')); // NUMBER OF BLOCKS IN THE BLOCKCHAIN FOR HALVING

    while (this.chainLength > y - 1) {
      supply = supply + y * reward;
      reward = reward / 2.0;
      this.chainLength = this.chainLength - y;
    }

    supply = supply + this.chainLength * reward;
    return {
      MINING_REWARD: reward.toFixed(8),
      supply: this.formatNumWithCommas(Math.round(supply + reward)),
    };
  }

  private formatNumWithCommas(x: number): string {
    return x.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',');
  }
}

export default Mining_Reward;
