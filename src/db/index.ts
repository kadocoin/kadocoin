import level from 'level'; // SOURCE => https://github.com/Level/level
import Block from '../blockchain/block';
import { balancesStorageFolder } from '../config/constants';
import { IValue } from '../types';
import logger from '../util/logger';

class LevelDB {
  balancesDB: level.LevelDB<any, any>;

  constructor() {
    this.balancesDB = level(balancesStorageFolder, { valueEncoding: 'json' });
  }

  public getAllKeysAndValues(): void {
    this.balancesDB
      .createReadStream()
      .on('data', (data: { key: string; value: any }) => logger.info('BalancesDB', { data }));
  }

  public async addOrUpdateBal(blocks: Array<Block>): Promise<void> {
    try {
      for (let i = 0; i < blocks.length; i++) {
        const block = blocks[i];
        const transactions = blocks[i]['transactions'];

        for (let j = 0; j < transactions.length; j++) {
          const transaction = transactions[j];

          if (Object.values(transaction['output']).length === 1) {
            /**
             * REWARD TRANSACTION
             */
            for (const address in transaction['output']) {
              if (Object.prototype.hasOwnProperty.call(transaction['output'], address)) {
                const newly_received_coins = transaction['output'][address] as string;

                // SAVE TO DB
                await this.incrementBal({ block, address, newly_received_coins });
              }
            }
          } else {
            /**
             * REGULAR TRANSACTION
             */
            Object.entries(transaction['output']).forEach(async ([address, coins], index) => {
              const newly_received_coins = coins as string;
              if (index === 0) {
                /*** THIS IS THE SENDER */

                if (Number(newly_received_coins) === 0) {
                  // REMOVE FROM DB IF THE SENDER HAS NO BALANCE LEFT
                  await this.balancesDB.del(address);
                } else {
                  // SENDER HAS BALANCE. OVERRIDE THE OLD BALANCE IT WITH THE NEW BALANCE
                  await this.balancesDB.put(address, this.valueToSave(block, newly_received_coins));
                }
              } else {
                /*** THIS IS THE RECEIVER */
                await this.incrementBal({ block, address, newly_received_coins });
              }
            });
          }
        }
      }
    } catch (error) {}
  }

  private async incrementBal({
    block,
    address,
    newly_received_coins,
  }: {
    block: Block;
    address: string;
    newly_received_coins: string;
  }): Promise<void> {
    try {
      const { message } = await this.getBal(address);

      const new_total_balance = Number(message) + Number(newly_received_coins);

      await this.putBal(address, this.valueToSave(block, new_total_balance.toFixed(8)));
    } catch (error) {
      logger.error(error);
    }
  }

  public getBal = (address: string): Promise<{ type: string; message: string }> =>
    new Promise((resolve, reject) => {
      this.balancesDB.get(address.trim(), (err: { notFound: any }, value: IValue) => {
        if (err) {
          if (err.notFound) resolve({ type: 'success', message: (0).toFixed(8) });

          reject({ type: 'error', message: 'Error getting balance. Please try again.' });
        } else {
          resolve({ type: 'success', message: value.bal });
        }
      });
    });

  public putBal = (key: string, value: IValue): Promise<{ type: string; message: string }> =>
    new Promise((resolve, reject) => {
      this.balancesDB.put(key, value, err => {
        if (err) reject({ type: 'error', message: 'Error saving balance. Please try again.' });

        resolve({ type: 'success', message: 'Success' });
      });
    });

  private valueToSave(block: Block, newly_received_coins: string): IValue {
    return {
      bal: newly_received_coins,
      height: block.blockchainHeight,
      timestamp: block.timestamp,
    };
  }
}

export default LevelDB;
