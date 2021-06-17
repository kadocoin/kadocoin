import joi from 'joi';
import { IUserModel } from '../types';

export const registerValidation = (user: IUserModel) => {
  const regSchema = joi.object({
    email: joi.string().email().required(),
    password: joi.string().min(6).required(),
    userCreationDate: joi.string(),
  });

  return regSchema.validate(user);
};

export const emailValidation = (email: string) => {
  const emailSchema = joi.string().email();

  return emailSchema.validate(email);
};

export const loginValidation = (user: IUserModel) => {
  const loginSchema = joi.object({
    email: joi.string().email().required(),
    password: joi.string().min(6).required(),
  });

  return loginSchema.validate(user);
};
