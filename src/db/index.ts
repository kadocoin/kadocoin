import level from 'level'; // SOURCE => https://github.com/Level/level
import Block from '../blockchain/block';
import { balancesStorageFolder } from '../config/constants';
import { IValue } from '../types';
import isEmptyObject from '../util/is-empty-object';
import logger from '../util/logger';

class LevelDB {
  balancesDB: level.LevelDB<any, any>;

  constructor() {
    this.balancesDB = level(
      balancesStorageFolder,
      { valueEncoding: 'json' },
      err => err && logger.fatal('DB error', { err })
      // TODO TRIGGER AN EVENT TO RESTART SERVER
    );
    this.getAllKeysAndValues();
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
                const newly_received_coins = transaction['output'][address];

                await this.updateValueOrCreateNew({
                  block,
                  address,
                  newlyReceivedCoins: newly_received_coins,
                  type: 'receiver',
                });
              }
            }
          } else {
            /**
             * REGULAR TRANSACTION
             */
            Object.entries(transaction['output']).forEach(
              async ([address, newly_received_coins], index) => {
                if (index === 0) {
                  /*** THIS IS THE SENDER */

                  if (Number(newly_received_coins) === 0) {
                    // REMOVE FROM DB IF THE SENDER HAS NO BALANCE LEFT
                    await this.balancesDB.del(address);
                  } else {
                    // SENDER HAS BALANCE. OVERRIDE THE OLD BALANCE IT WITH THE NEW BALANCE
                    await this.updateValueOrCreateNew({
                      block,
                      address,
                      newlyReceivedCoins: newly_received_coins,
                      type: 'sender',
                    });
                  }
                } else {
                  /*** THIS IS THE RECEIVER */
                  await this.updateValueOrCreateNew({
                    block,
                    address,
                    newlyReceivedCoins: newly_received_coins,
                    type: 'receiver',
                  });
                }
              }
            );
          }
        }
      }
    } catch (error) {
      logger.error('Error at method => addOrUpdateBal', { error });
    }
  }

  private async updateValueOrCreateNew({
    block,
    address,
    newlyReceivedCoins,
    type,
  }: {
    block: Block;
    address: string;
    newlyReceivedCoins: string;
    type: string;
  }): Promise<void> {
    try {
      const { message } = await this.getValue(address);

      // SAVE VALUE FOR ALREADY EXISTING ADDRESS
      if (isEmptyObject(message)) {
        let { bal, totalReceived, totalSent, txnCount } = message;

        if (type == 'sender') {
          txnCount += 1;
          bal = newlyReceivedCoins;
          const newly_amount_sent = Number(bal) - Number(newlyReceivedCoins); // SENDER'S OUTPUT BAL IS `newlyReceivedCoins`
          totalSent = (Number(totalSent) + newly_amount_sent).toString(8);
        }

        if (type == 'receiver') {
          bal = (Number(bal) + Number(newlyReceivedCoins)).toString(8);
          totalReceived = (Number(totalReceived) + Number(newlyReceivedCoins)).toString(8);
        }

        await this.putBal(address, {
          bal,
          height: block.blockchainHeight,
          timestamp: block.timestamp,
          totalSent,
          totalReceived,
          txnCount,
        });
      } else {
        await this.saveValueForNewAddress({ address, block, newlyReceivedCoins, type });
      }
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

  public getValue = (
    address: string
  ): Promise<{ type: string; message: IValue | Record<string, never> }> => {
    return new Promise((resolve, reject) => {
      this.balancesDB.get(address.trim(), (err: { notFound: any }, value: IValue) => {
        if (err) {
          if (err.notFound) return resolve({ type: 'success', message: {} });

          reject({ type: 'error', message: 'Error getting value. Please try again.' });
        } else {
          return resolve({ type: 'success', message: value });
        }
      });
    });
  };

  public putBal = (key: string, value: IValue): Promise<{ type: string; message: string }> =>
    new Promise((resolve, reject) => {
      this.balancesDB.put(key, value, err => {
        if (err) reject({ type: 'error', message: 'Error saving balance. Please try again.' });

        resolve({ type: 'success', message: 'Success' });
      });
    });

  private async saveValueForNewAddress({
    address,
    block,
    newlyReceivedCoins,
    type,
  }: {
    address: string;
    block: Block;
    newlyReceivedCoins: string;
    type: string;
  }): Promise<void> {
    await this.putBal(address, {
      bal: newlyReceivedCoins,
      height: block.blockchainHeight,
      timestamp: block.timestamp,
      totalSent: type == 'sender' ? newlyReceivedCoins : (0).toFixed(8),
      totalReceived: type == 'receiver' ? newlyReceivedCoins : (0).toFixed(8),
      txnCount: 0,
    });
  }
}

export default LevelDB;
