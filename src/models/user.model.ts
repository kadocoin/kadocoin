import { IUserModel } from '../types';
import { nanoid } from 'nanoid';
import { Db } from 'mongodb';

export class UserModel {
  async save(db: Db, { email, hashedPassword, userCreationDate }: IUserModel) {
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
