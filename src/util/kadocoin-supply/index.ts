function numberWithCommas(x: number) {
  return x.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',');
}

function kadocoinSupply(blocks: number) {
  // IT TAKES THIS NUMBER OF BLOCKS IN THE BLOCKCHAIN TO GET 500,000,000 KADOCOINS - FIVE HUNDRED MILLION
  // BEYOND THAT NUMBER, THE NUMBER OF KADOCOINS WON'T GO BEYOND 500,000,000
  if (blocks >= Number('169,999,999'.replace(/,/g, '')))
    return { MINING_REWARD: 0, supply: '500,000,000' };

  let reward = 50,
    supply = 0;
  const y = Number('5,000,000'.replace(/,/g, '')); // NUMBER OF BLOCKS IN THE BLOCKCHAIN FOR HALVING

  while (blocks > y - 1) {
    supply = supply + y * reward;
    reward = reward / 2.0;
    blocks = blocks - y;
  }

  supply = supply + blocks * reward;
  return {
    MINING_REWARD: reward.toFixed(8),
    supply: numberWithCommas(Math.round(supply + reward)),
    when: 'end',
  };
}

console.log(kadocoinSupply(Number('169,999,999'.replace(/,/g, ''))));
