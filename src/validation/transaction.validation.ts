import Joi, { ValidationResult } from 'joi';

export const transactValidation = (body: {
  amount: number;
  recipient: string;
}): ValidationResult => {
  const transactSchema = Joi.object().keys({
    amount: Joi.number().positive().required(),
    recipient: Joi.string().required(),
    publicKey: Joi.string().required(),
    address: Joi.string().required(),
    token: Joi.string().required(),
    message: Joi.string(),
  });

  return transactSchema.validate(body, { convert: true });
};

export const mineValidation = (address: string): ValidationResult => {
  return Joi.string().required().label('Kadocoin wallet address').validate(address);
};
