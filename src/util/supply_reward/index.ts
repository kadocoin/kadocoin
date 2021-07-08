/*
 * # Kadocoin License
 *
 * Copyright (c) 2021 Adamu Muhammad Dankore
 * Distributed under the MIT software license, see the accompanying
 * file LICENSE or <http://www.opensource.org/licenses/mit-license.php>
 */
/**
 * @class Mining_reward
 * @description
 * IT TAKES 169,999,999 BLOCKS IN THE BLOCKCHAIN TO GET TO 500,000,000 KADOCOINS - FIVE HUNDRED MILLION
 * BEYOND THAT, THE NUMBER OF KADOCOINS WON'T GO BEYOND 500,000,000.
 * MINING_REWARD FALLS TO 0.00000001 AT 169,999,999. BEYOND THAT MINING_REWARD FALLS TO 0.00000000
 */
class Mining_Reward {
  calc({ chainLength }: { chainLength: number }): { MINING_REWARD: string; SUPPLY: string } {
    if (chainLength >= Number('169,999,999'.replace(/,/g, '')))
      return { MINING_REWARD: (0).toFixed(8), SUPPLY: (500000000).toFixed(8) };

    let reward = 50,
      supply = 0;
    const y = Number('5,000,000'.replace(/,/g, '')); // NUMBER OF BLOCKS IN THE BLOCKCHAIN FOR HALVING

    while (chainLength > y - 1) {
      supply = supply + y * reward;
      reward = reward / 2.0;
      chainLength -= y;
    }

    supply = supply + chainLength * reward;

    return {
      MINING_REWARD: reward.toFixed(8),
      SUPPLY: (supply + reward).toFixed(8),
    };
  }
}

export default Mining_Reward;
