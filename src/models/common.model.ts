import { Db } from 'mongodb';
import { IUserModel } from '../types';
import { CommonInterface } from './common/common.interface';

export class CommonModel implements CommonInterface<IUserModel> {
  findByEmail = async (db: Db, email: string) => {
    try {
      return db
        .collection('users')
        .findOne({
          email,
        })
        .then(user => user || null);
    } catch (error) {
      console.log('findByEmail', error);
    }
  };

  findById = async (db: Db, id: string) => {
    try {
      return db
        .collection('users')
        .findOne({
          _id: id,
        })
        .then(user => user || null);
    } catch (error) {
      console.log('findById', error);
    }
  };

  findByAddress = async (db: Db, address: string) => {
    try {
      return db
        .collection('users')
        .findOne({
          address,
        })
        .then(user => user || null);
    } catch (error) {
      console.log('findByAddress', error);
    }
  };

  findWalletByAddress = async (db: Db, address: string) => {
    try {
      return db
        .collection('users')
        .findOne({
          address,
        })
        .then(user => user.wallet || null);
    } catch (error) {
      console.log('findByAddress', error);
    }
  };

  findWalletByPublicKey = async (db: Db, publicKey: string) => {
    try {
      return db
        .collection('users')
        .findOne({
          publicKey,
        })
        .then(user => user || null);
    } catch (error) {
      console.log('findWalletByPublicKey', error);
    }
  };

  // END CLASS
}
