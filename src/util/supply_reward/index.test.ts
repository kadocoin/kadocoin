import Mining_Reward from '.';

describe('Mining_reward', () => {
  let mining_reward: Mining_Reward,
    halving: number,
    halving_2: number,
    halving_3: number,
    halving_4: number,
    halving_5: number,
    blocks_at_max_supply: number;

  beforeEach(() => {
    mining_reward = new Mining_Reward();
    halving = 5000000;
    halving_2 = 2 * halving;
    halving_3 = 3 * halving;
    halving_4 = 4 * halving;
    halving_5 = 5 * halving;
    blocks_at_max_supply = 169999999; // 169,999,999
  });

  describe('calc()', () => {
    describe('testBeginning', () => {
      it('1 block a.k.a first block/genesis', () =>
        expect(mining_reward.calc({ chainLength: 0 }).SUPPLY).toEqual((50).toFixed(8)));
      it('2 blocks', () =>
        expect(mining_reward.calc({ chainLength: 1 }).SUPPLY).toEqual((100).toFixed(8)));
      it('3 blocks', () =>
        expect(mining_reward.calc({ chainLength: 2 }).SUPPLY).toEqual((150).toFixed(8)));
      it('4 blocks', () =>
        expect(mining_reward.calc({ chainLength: 3 }).SUPPLY).toEqual((200).toFixed(8)));
    });

    describe('test1stHalving', () => {
      it('2 blocks to 1st halving', () =>
        expect(mining_reward.calc({ chainLength: halving - 2 }).SUPPLY).toEqual(
          (249999950).toFixed(8)
        ));
      it('1 block to 1st halving', () =>
        expect(mining_reward.calc({ chainLength: halving - 1 }).SUPPLY).toEqual(
          (250000000).toFixed(8)
        ));
      it('1st halving', () =>
        expect(mining_reward.calc({ chainLength: halving }).SUPPLY).toEqual(
          (250000025).toFixed(8)
        ));
      it('1 block after halving', () =>
        expect(mining_reward.calc({ chainLength: halving + 1 }).SUPPLY).toEqual(
          (250000050).toFixed(8)
        ));
      it('2 blocks after halving', () =>
        expect(mining_reward.calc({ chainLength: halving + 2 }).SUPPLY).toEqual(
          (250000075).toFixed(8)
        ));
    });

    describe('test2ndHalving', () => {
      it('2 blocks before 2nd halving', () =>
        expect(mining_reward.calc({ chainLength: halving_2 - 2 }).SUPPLY).toEqual(
          (374999975).toFixed(8)
        ));
      it('1 block before 2nd halving', () =>
        expect(mining_reward.calc({ chainLength: halving_2 - 1 }).SUPPLY).toEqual(
          (375000000).toFixed(8)
        ));
      it('2nd halving', () =>
        expect(mining_reward.calc({ chainLength: halving_2 }).SUPPLY).toEqual(
          (375000012.5).toFixed(8)
        ));
      it('1 block after 2nd halving', () =>
        expect(mining_reward.calc({ chainLength: halving_2 + 1 }).SUPPLY).toEqual(
          (375000025).toFixed(8)
        ));
      it('2 blocks after 2nd halving', () =>
        expect(mining_reward.calc({ chainLength: halving_2 + 2 }).SUPPLY).toEqual(
          (375000037.5).toFixed(8)
        ));
    });

    describe('test3rdHalving', () => {
      it('2 blocks before 3rd halving', () =>
        expect(mining_reward.calc({ chainLength: halving_3 - 2 }).SUPPLY).toEqual(
          (437499987.5).toFixed(8)
        ));
      it('1 block before 3rd halving', () =>
        expect(mining_reward.calc({ chainLength: halving_3 - 1 }).SUPPLY).toEqual(
          (437500000).toFixed(8)
        ));
      it('3rd halving', () =>
        expect(mining_reward.calc({ chainLength: halving_3 }).SUPPLY).toEqual(
          (437500006.25).toFixed(8)
        ));
      it('1 block after 3rd halving', () =>
        expect(mining_reward.calc({ chainLength: halving_3 + 1 }).SUPPLY).toEqual(
          (437500012.5).toFixed(8)
        ));
      it('2 blocks after 3rd halving', () =>
        expect(mining_reward.calc({ chainLength: halving_3 + 2 }).SUPPLY).toEqual(
          (437500018.75).toFixed(8)
        ));
    });

    describe('test4thHalving', () => {
      it('2 blocks before 4th halving', () =>
        expect(mining_reward.calc({ chainLength: halving_4 - 2 }).SUPPLY).toEqual(
          (468749993.75).toFixed(8)
        ));
      it('1 block before 4th halving', () =>
        expect(mining_reward.calc({ chainLength: halving_4 - 1 }).SUPPLY).toEqual(
          (468750000).toFixed(8)
        ));
      it('4th halving', () =>
        expect(mining_reward.calc({ chainLength: halving_4 }).SUPPLY).toEqual(
          (468750003.125).toFixed(8)
        ));
      it('1 block after 4th halving', () =>
        expect(mining_reward.calc({ chainLength: halving_4 + 1 }).SUPPLY).toEqual(
          (468750006.25).toFixed(8)
        ));
      it('2 blocks after 4th halving', () =>
        expect(mining_reward.calc({ chainLength: halving_4 + 2 }).SUPPLY).toEqual(
          (468750009.375).toFixed(8)
        ));
    });

    describe('test5thHalving', () => {
      it('2 blocks before 5th halving', () =>
        expect(mining_reward.calc({ chainLength: halving_5 - 2 }).SUPPLY).toEqual(
          (484374996.875).toFixed(8)
        ));
      it('1 block before 5th halving', () =>
        expect(mining_reward.calc({ chainLength: halving_5 - 1 }).SUPPLY).toEqual(
          (484375000).toFixed(8)
        ));
      it('5th halving', () =>
        expect(mining_reward.calc({ chainLength: halving_5 }).SUPPLY).toEqual(
          (484375001.5625).toFixed(8)
        ));
      it('1 block after 5th halving', () =>
        expect(mining_reward.calc({ chainLength: halving_5 + 1 }).SUPPLY).toEqual(
          (484375003.125).toFixed(8)
        ));
      it('2 blocks after 5th halving', () =>
        expect(mining_reward.calc({ chainLength: halving_5 + 2 }).SUPPLY).toEqual(
          (484375004.6875).toFixed(8)
        ));
    });

    describe('testOverTime', () => {
      it('10', () =>
        expect(mining_reward.calc({ chainLength: 10 }).SUPPLY).toEqual((550).toFixed(8)));
      it('100', () =>
        expect(mining_reward.calc({ chainLength: 100 }).SUPPLY).toEqual((5050).toFixed(8)));
      it('1000', () =>
        expect(mining_reward.calc({ chainLength: 1000 }).SUPPLY).toEqual((50050).toFixed(8)));
      it('10000', () =>
        expect(mining_reward.calc({ chainLength: 10000 }).SUPPLY).toEqual((500050).toFixed(8)));
      it('100000', () =>
        expect(mining_reward.calc({ chainLength: 100000 }).SUPPLY).toEqual((5000050).toFixed(8)));
      it('250000', () =>
        expect(mining_reward.calc({ chainLength: 250000 }).SUPPLY).toEqual((12500050).toFixed(8)));
      it('500000', () =>
        expect(mining_reward.calc({ chainLength: 500000 }).SUPPLY).toEqual((25000050).toFixed(8)));
      it('1000000', () =>
        expect(mining_reward.calc({ chainLength: 1000000 }).SUPPLY).toEqual((50000050).toFixed(8)));
      it('5000000', () =>
        expect(mining_reward.calc({ chainLength: 5000000 }).SUPPLY).toEqual(
          (250000025).toFixed(8)
        ));
      it('15000000', () =>
        expect(mining_reward.calc({ chainLength: 15000000 }).SUPPLY).toEqual(
          (437500006.25).toFixed(8)
        ));
    });

    describe('testEndOfHalvings', () => {
      it('5 blocks before MAX SUPPLY', () =>
        expect(mining_reward.calc({ chainLength: blocks_at_max_supply - 5 }).SUPPLY).toEqual(
          (499999999.97089618).toFixed(8)
        ));
      it('4 blocks before MAX SUPPLY', () =>
        expect(mining_reward.calc({ chainLength: blocks_at_max_supply - 4 }).SUPPLY).toEqual(
          (499999999.97089618).toFixed(8)
        ));
      it('3 blocks before MAX SUPPLY', () =>
        expect(mining_reward.calc({ chainLength: blocks_at_max_supply - 3 }).SUPPLY).toEqual(
          (499999999.97089618).toFixed(8)
        ));
      it('2 blocks before MAX SUPPLY', () =>
        expect(mining_reward.calc({ chainLength: blocks_at_max_supply - 2 }).SUPPLY).toEqual(
          (499999999.97089618).toFixed(8)
        ));
      it('1 block before MAX SUPPLY', () =>
        expect(mining_reward.calc({ chainLength: blocks_at_max_supply - 1 }).SUPPLY).toEqual(
          (499999999.97089618).toFixed(8)
        ));
      it('MAX SUPPLY', () =>
        expect(mining_reward.calc({ chainLength: blocks_at_max_supply - 5 }).SUPPLY).toEqual(
          (499999999.97089618).toFixed(8)
        ));
      it('1 block after MAX SUPPLY', () =>
        expect(mining_reward.calc({ chainLength: blocks_at_max_supply + 1 }).SUPPLY).toEqual(
          (500000000).toFixed(8)
        ));
      it('2 blocks after MAX SUPPLY', () =>
        expect(mining_reward.calc({ chainLength: blocks_at_max_supply + 2 }).SUPPLY).toEqual(
          (500000000).toFixed(8)
        ));
      it('3 blocks after MAX SUPPLY', () =>
        expect(mining_reward.calc({ chainLength: blocks_at_max_supply + 3 }).SUPPLY).toEqual(
          (500000000).toFixed(8)
        ));
      it('4 blocks after MAX SUPPLY', () =>
        expect(mining_reward.calc({ chainLength: blocks_at_max_supply + 4 }).SUPPLY).toEqual(
          (500000000).toFixed(8)
        ));
      it('5 blocks after MAX SUPPLY', () =>
        expect(mining_reward.calc({ chainLength: blocks_at_max_supply + 5 }).SUPPLY).toEqual(
          (500000000).toFixed(8)
        ));
    });

    describe('testFarInTheFuture', () => {
      it('10 to the power 10', () =>
        expect(mining_reward.calc({ chainLength: Math.pow(10, 10) }).SUPPLY).toEqual(
          (500000000).toFixed(8)
        ));
      it('10 to the power 50', () =>
        expect(mining_reward.calc({ chainLength: Math.pow(10, 50) }).SUPPLY).toEqual(
          (500000000).toFixed(8)
        ));
      it('10 to the power 100', () =>
        expect(mining_reward.calc({ chainLength: Math.pow(10, 100) }).SUPPLY).toEqual(
          (500000000).toFixed(8)
        ));
      it('10 to the power 1000', () =>
        expect(mining_reward.calc({ chainLength: Math.pow(10, 1000) }).SUPPLY).toEqual(
          (500000000).toFixed(8)
        ));
    });
    // END CALC()
  });
});
