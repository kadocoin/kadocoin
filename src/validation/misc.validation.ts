/*
 * # Kadocoin License
 *
 * Copyright (c) 2021 Adamu Muhammad Dankore
 * Distributed under the MIT software license, see the accompanying
 * file LICENSE or <http://www.opensource.org/licenses/mit-license.php>
 */
import Joi, { ValidationResult } from 'joi';

export const addressValidation = (address: string): ValidationResult => {
  return Joi.string().required().label('address').validate(address);
};
