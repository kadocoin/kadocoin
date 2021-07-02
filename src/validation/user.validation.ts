import Joi, { ValidationResult } from 'joi';
import { IUserModel } from '../types';

export const registerValidation = (user: IUserModel): ValidationResult => {
  const regSchema = Joi.object({
    email: Joi.string().email().required(),
    password: Joi.string().min(6).required(),
    userCreationDate: Joi.string(),
  });

  return regSchema.validate(user);
};

export const emailValidation = (email: string): ValidationResult => {
  return Joi.string().email().label('Email').validate(email);
};

export const loginValidation = (user: IUserModel): ValidationResult => {
  const loginSchema = Joi.object({
    email: Joi.string().email().required(),
    password: Joi.string().min(6).required(),
  });

  return loginSchema.validate(user);
};

export const walletInfoValidation = (address: string): ValidationResult => {
  const walletInfoSchema = Joi.object({
    address: Joi.string().required(),
    token: Joi.string().required(),
  });

  return walletInfoSchema.validate(address);
};
