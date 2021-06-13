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
      console.log('findUserByEmail', error);
    }
  };
}
