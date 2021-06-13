import joi from 'joi';
import { IUserModel } from '../types';

export const registerValidation = (user: IUserModel) => {
  const userSchema = joi.object({
    email: joi.string().required(),
    password: joi.string().min(3).required(),
  });

  return userSchema.validate(user);
};

export const emailValidation = (email: string) => {
  const schema = joi.string().email();

  return schema.validate(email);
};
