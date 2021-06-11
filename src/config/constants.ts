
const INITIAL_DIFFICULTY = 3;
export const MINE_RATE = 1000;
export const PORT: number = 5000 || process.env.PORT;
export const DEFAULT_MESSAGE: string = 'Welcome to node js';
export const GENESIS_DATA = {
  timestamp: 1,
  lastHash: '____',
  hash: '_____',
  difficulty: INITIAL_DIFFICULTY,
  nonce: 0,
  data: [],
};

export const STARTING_BALANCE = 1000;
export const REWARD_INPUT = { address: '*authorized-reward*' };
export const MINING_REWARD = 50;
export const COINS_IN_CIRCULATION = 0;
