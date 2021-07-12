/*
 * # Kadocoin License
 *
 * Copyright (c) 2021 Adamu Muhammad Dankore
 * Distributed under the MIT software license, see the accompanying
 * file LICENSE or <http://www.opensource.org/licenses/mit-license.php>
 */
import Joi, { ValidationResult } from 'joi';

export const transactValidation = (body: {
  amount: string;
  recipient: string;
  publicKey: string;
  address: string;
  message: string;
}): ValidationResult => {
  const transactSchema = Joi.object().keys({
    amount: Joi.number().positive().required(),
    recipient: Joi.string().trim().required(),
    publicKey: Joi.string().trim().required(),
    address: Joi.string().trim().required(),
    token: Joi.string().trim().required(),
    message: Joi.string().trim(),
  });

  return transactSchema.validate(body, { convert: true });
};

export const mineValidation = (body: { address: string; message: string }): ValidationResult => {
  const mineSchema = Joi.object().keys({
    address: Joi.string().trim().required(),
    message: Joi.string().trim().max(160),
    token: Joi.string().trim().required(),
  });

  return mineSchema.validate(body);
};
