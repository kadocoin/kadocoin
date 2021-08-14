/*
 * # Kadocoin License
 *
 * Copyright (c) 2021 Adamu Muhammad Dankore
 * Distributed under the MIT software license, see the accompanying
 * file LICENSE or <http://www.opensource.org/licenses/mit-license.php>
 */
import Joi, { ValidationResult } from 'joi';

export const registerValidation = (user: {
  email: string;
  password: string;
  userCreationDate: string;
}): ValidationResult => {
  const regSchema = Joi.object({
    email: Joi.string().email().required(),
    password: Joi.string().min(6).required(),
    userCreationDate: Joi.string(),
  });

  return regSchema.validate(user);
};

export const emailValidation = (email: string): ValidationResult => {
  return Joi.string().required().email().label('Email').validate(email);
};

export const tokenValidation = (verification_token_reset_password: string): ValidationResult => {
  return Joi.string().required().label('token').validate(verification_token_reset_password);
};

export const loginValidation = (user: { email: string; password: string }): ValidationResult => {
  const loginSchema = Joi.object({
    email: Joi.string().email().required(),
    password: Joi.string().min(6).max(128).required(),
  });

  return loginSchema.validate(user);
};

export const addressValidation = (address: string): ValidationResult => {
  return Joi.string().required().label('address').validate(address);
};

export const editProfileInfoValidation = (reqBody: {
  user_id: string;
  token: string;
  name: string;
  bio: string;
  email: string;
  currentProfilePicture: Blob;
}): ValidationResult => {
  const editProfileInfoSchema = Joi.object({
    user_id: Joi.string().required(),
    token: Joi.string().required(),
    name: Joi.string().allow(''),
    bio: Joi.string().allow('').max(160),
    email: Joi.string().email(),
    currentProfilePicture: Joi.string().allow(''),
  });

  return editProfileInfoSchema.validate(reqBody);
};

export const change_password_validation = (reqBody: {
  user_id: string;
  token: string;
  current_password: string;
  new_password: string;
  re_entered_new_password: string;
}): ValidationResult => {
  const change_password_schema = Joi.object({
    user_id: Joi.string().required(),
    token: Joi.string().required(),
    current_password: Joi.string().required().min(6).max(128).label('Current Password'),
    new_password: Joi.string().required().min(6).max(128).label('New Password'),
    re_entered_new_password: Joi.any()
      .equal(Joi.ref('new_password'))
      .required()
      .label('Re-entered New Password')
      .messages({ 'any.only': 'Passwords do not match' }),
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

export const verify_token_validation = (reqBody: {
  verification_token: string;
}): ValidationResult => {
  const verify_token_email_schema = Joi.object({
    verification_token: Joi.string().required(),
  });

  return verify_token_email_schema.validate(reqBody);
};

export const userId_email_token_validation = (reqBody: {
  user_id: string;
  email: string;
  token: string;
}): ValidationResult => {
  const userId_email_token_schema = Joi.object({
    user_id: Joi.string().required(),
    email: Joi.string().email().required(),
    token: Joi.string().required(),
  });

  return userId_email_token_schema.validate(reqBody);
};

export const forgot_password_step_2_validation = (reqBody: {
  user_id: string;
  new_password: string;
  re_entered_new_password: string;
}): ValidationResult => {
  const forgot_password_step_2_schema = Joi.object({
    user_id: Joi.string().required(),
    new_password: Joi.string().required().min(6).max(128).label('New Password'),
    re_entered_new_password: Joi.any()
      .equal(Joi.ref('new_password'))
      .required()
      .label('Re-entered New Password')
      .messages({ 'any.only': 'Passwords do not match' }),
  });

  return forgot_password_step_2_schema.validate(reqBody);
};
