import Blockchain from './blockchain';
import PubSub from './pubSub';
import TransactionMiner from './transactionMiner';
import Wallet from './wallet';
import TransactionPool from './wallet/transaction-pool';

const localWallet = new Wallet();
const walletFoo = new Wallet();
const walletBar = new Wallet();
const blockchain = new Blockchain();
const transactionPool = new TransactionPool();
const pubSub = new PubSub({ blockchain, transactionPool });

const generateWalletTransaction = ({
  recipient,
  amount,
  publicKey,
  address,
  message,
  sendFee,
}: {
  recipient: any;
  amount: any;
  publicKey: any;
  address: any;
  message: any;
  sendFee: any;
}) => {
  const transaction = localWallet.createTransaction({
    recipient,
    amount,
    chain: blockchain.chain,
    publicKey,
    address,
    message,
    sendFee,
  });

  transactionPool.setTransaction(transaction);
};

const walletAction = () =>
  generateWalletTransaction({
    recipient: walletFoo.address,
    amount: 20,
    publicKey: walletBar.publicKey,
    address: walletBar.address,
    message: 'walletBar',
    sendFee: '10',
  });
const walletFooAction = () =>
  generateWalletTransaction({
    recipient: walletBar.address,
    amount: 8,
    publicKey: walletFoo.publicKey,
    address: walletFoo.address,
    message: 'walletFoo',
    sendFee: '10',
  });

const walletBarAction = () =>
  generateWalletTransaction({
    recipient: localWallet.address,
    amount: 45,
    publicKey: walletBar.publicKey,
    address: walletBar.address,
    message: 'walletBar',
    sendFee: '10',
  });

for (let i = 0; i < 10; i++) {
  if (i % 3 === 0) {
    walletAction();
    walletFooAction();
  } else if (i % 3 === 1) {
    walletAction();
    walletBarAction();
  } else {
    walletFooAction();
    walletBarAction();
  }

  const transactionMiner = new TransactionMiner({
    blockchain: blockchain,
    transactionPool: transactionPool,
    address: walletBar.address,
    pubSub: pubSub,
    message: 'Miner!!!',
  });

  const status = transactionMiner.mineTransactions();

  console.log({ status });
}
