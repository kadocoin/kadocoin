/*
 * # Kadocoin License
 *
 * Copyright (c) 2021 Adamu Muhammad Dankore
 * Distributed under the MIT software license, see the accompanying
 * file LICENSE or <http://www.opensource.org/licenses/mit-license.php>
 */
import { IUserModel } from '../types';
import { ADMIN_EMAIL } from '../config/secret';
import { nanoid } from 'nanoid';
import { Db } from 'mongodb';

export default class UserModel {
  async register(
    db: Db,
    { email, hashedPassword, address, userCreationDate, publicKey }: IUserModel,
    { verification_token, token_expiry }: { verification_token: string; token_expiry: number }
  ): Promise<IUserModel> {
    try {
      return db
        .collection('users')
        .insertOne({
          _id: nanoid(12),
          emailVerified: false,
          profilePicture: '',
          userCreationDate,
          email,
          password: hashedPassword,
          address,
          publicKey,
          name: '',
          bio: '',
          ...(email == `${ADMIN_EMAIL}` ? { scope: ['user', 'admin'] } : { scope: ['user'] }),
          registrationMethod: 'email_password',
          verification_token,
          token_expiry,
        })
        .then(({ ops }) => ops[0]);
    } catch (error) {
      throw new Error(`register, ${error}`);
    }
  }

  async updateUserById(
    db: Db,
    userId: string,
    update: {
      name?: string;
      bio?: string;
      email?: string;
      profilePicture?: string;
      password?: string;
    }
  ): Promise<IUserModel> {
    try {
      return db
        .collection('users')
        .findOneAndUpdate({ _id: userId }, { $set: update }, { returnDocument: 'after' })
        .then(({ value }) => value);
    } catch (error) {
      throw new Error(`updateUserById, ${error}`);
    }
  }

  async delete_account(db: Db, userId: string): Promise<any> {
    try {
      return await (
        await db.collection('users').findOneAndDelete({ _id: userId })
      ).value;
    } catch (error) {
      throw new Error(`delete_account", ${error}`);
    }
  }
}
