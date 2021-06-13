import { Db } from 'mongodb';
import { IUserModel } from '../types';
import { LoginInterface } from './common/login.interface';

export class LoginService implements LoginInterface<IUserModel> {
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
