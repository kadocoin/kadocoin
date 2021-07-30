/*
 * # Kadocoin License
 *
 * Copyright (c) 2021 Adamu Muhammad Dankore
 * Distributed under the MIT software license, see the accompanying
 * file LICENSE or <http://www.opensource.org/licenses/mit-license.php>
 */
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
    password: Joi.string().min(6).max(128).required(),
  });

  return loginSchema.validate(user);
};

export const walletInfoValidation = (reqBody: {
  address: string;
  token: string;
}): ValidationResult => {
  const walletInfoSchema = Joi.object({
    address: Joi.string().required(),
    token: Joi.string().required(),
  });

  return walletInfoSchema.validate(reqBody);
};

export const editProfileInfoValidation = (reqBody: {
  userId: string;
  token: string;
  name: string;
  bio: string;
  email: string;
  currentProfilePicture: Blob;
}): ValidationResult => {
  const editProfileInfoSchema = Joi.object({
    userId: Joi.string().required(),
    token: Joi.string().required(),
    name: Joi.string().allow(''),
    bio: Joi.string().allow('').max(160),
    email: Joi.string().email(),
    currentProfilePicture: Joi.string().allow(''),
  });

  return editProfileInfoSchema.validate(reqBody);
};

export const change_password_validation = (reqBody: {
  userId: string;
  token: string;
  current_password: string;
  new_password: string;
  re_entered_new_password: string;
}): ValidationResult => {
  const change_password_schema = Joi.object({
    userId: Joi.string().required(),
    token: Joi.string().required(),
    current_password: Joi.string().required().min(6).max(128).label('Current Password'),
    new_password: Joi.string().required().min(6).max(128).label('New Password'),
    re_entered_new_password: Joi.any()
      .equal(Joi.ref('new_password'))
      .required()
      .label('Re-entered New Password')
      .messages({ 'any.only': 'New passwords do not match' }),
  });

  return change_password_schema.validate(reqBody);
};

export const delete_account_validation = (reqBody: {
  user_id: string;
  token: string;
}): ValidationResult => {
  const delete_account_schema = Joi.object({
    user_id: Joi.string().required(),
    token: Joi.string().required(),
  });

  return delete_account_schema.validate(reqBody);
};

export const send_verification_email_validation = (reqBody: {
  user_id: string;
  email: string;
  token: string;
}): ValidationResult => {
  const send_verification_email_schema = Joi.object({
    user_id: Joi.string().required(),
    email: Joi.string().email().required(),
    token: Joi.string().required(),
  });

  return send_verification_email_schema.validate(reqBody);
};
