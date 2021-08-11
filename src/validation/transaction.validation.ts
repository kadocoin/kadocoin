/*
 * # Kadocoin License
 *
 * Copyright (c) 2021 Adamu Muhammad Dankore
 * Distributed under the MIT software license, see the accompanying
 * file LICENSE or <http://www.opensource.org/licenses/mit-license.php>
 */
import Joi, { ValidationResult } from 'joi';

export const transactValidation = (body: {
  user_id: string;
  amount: string;
  recipient: string;
  publicKey: string;
  address: string;
  message: string;
  sendFee: string;
}): ValidationResult => {
  const transactSchema = Joi.object().keys({
    user_id: Joi.string().required(),
    amount: Joi.number().positive().required(),
    recipient: Joi.string().trim().required(),
    publicKey: Joi.string().trim().required(),
    address: Joi.string().trim().required(),
    message: Joi.string().trim().allow(''),
    sendFee: Joi.number().positive().allow(''),
  });

  return transactSchema.validate(body, { convert: true });
};

export const mineValidation = (body: { address: string; message?: string }): ValidationResult => {
  const mineSchema = Joi.object().keys({
    address: Joi.string().trim().required(),
    message: Joi.string().trim().max(160).allow(''),
  });

  return mineSchema.validate(body);
};
