import Joi, { ValidationResult } from 'joi';

export const transactValidation = (body: {
  amount: string;
  recipient: string;
  publicKey: string;
  address: string;
  token: string;
  message: string;
}): ValidationResult => {
  const transactSchema = Joi.object().keys({
    amount: Joi.number().positive().required(),
    recipient: Joi.string().trim().required(),
    publicKey: Joi.string().trim().required(),
    address: Joi.string().trim().required(),
    token: Joi.string().trim().required(),
    message: Joi.string().trim().max(160),
  });

  return transactSchema.validate(body, { convert: true });
};

export const mineValidation = (address: string): ValidationResult => {
  return Joi.string().required().label('Kadocoin wallet address').validate(address);
};
