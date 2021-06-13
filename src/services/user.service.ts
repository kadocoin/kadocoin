import { IUserModel } from '../models/user';
import { BaseInterface } from './common/base.interface';
import { Model } from 'mongoose';
import { nanoid } from 'nanoid';
import { Db } from 'mongodb';

export class UserService {
  async save(db: Db, { email, userCreationDate, hashedPassword }: IUserModel) {
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
          name: '',
          bio: '',
          ...(email == `${process.env.ADMIN_EMAIL}` ? { scope: ['user', 'admin'] } : { scope: ['user'] }),
          registrationMethod: 'email_password',
        })
        .then(({ ops }) => ops[0]);
    } catch (error) {
      console.log('insertUser', error);
    }
  }
}
