const INITIAL_DIFFICULTY = 3;
export const MINE_RATE = 1000;
export const DEFAULT_MESSAGE =
  "Welcome to Kadocoin API. Visit https://kadocoin.com";
export const GENESIS_DATA = {
  timestamp: 1,
  lastHash: "____",
  hash: "hash-one",
  difficulty: INITIAL_DIFFICULTY,
  nonce: 0,
  data: [],
};

export const STARTING_BALANCE = 1000;
export const MINING_REWARD = 50;
export const REWARD_INPUT = {
  address: "*authorized-reward*",
  recipient: "*authorized-recipient*",
  amount: MINING_REWARD,
  timestamp: 1624848894788,
  signature: "*authorized-signature*",
  localPublicKey: "*authorized-localPublicKey*",
  publicKey: "*authorized-publicKey*",
};
export const COINS_IN_CIRCULATION = 0;

export const swaggerOptions = {
  swaggerDefinition: {
    info: {
      description: "Kadocoin MultiWallet API",
      title: "Kadocoin MultiWallet API",
      version: "1.0.0",
      contact: {
        name: "Adamu Muhammad Dankore",
        url: "https://dankore.com",
        email: "adamu@kadocoin.com",
      },
      license: {
        name: "MIT",
        url: "https://dankore.com",
      },
    },
    externalDocs: {
      url: "https://kadocoin.com/terms",
      description: "Terms of Use",
    },
    consumes: ["application/json"],
    tags: [
      { name: "Registration", description: "API" },
      { name: "Login", description: "API" },
    ],
    uiConfig: {
      docExpansion: "full",
      deepLinking: false,
    },
    staticCSP: true,
    host: "localhost:2000",
    basePath: "/",
    produces: ["application/json", "application/xml"],
    schemes: ["http", "https"],
  },
  basedir: __dirname,
  apis: ["./src/routes/userRouter.router.ts"], //Path to the API route handle folder
};
