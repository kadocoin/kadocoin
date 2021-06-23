import Joi from 'joi';

export const transactValidation = (body: { amount: string; recipient: string }) => {
  const transactSchema = Joi.object({
    amount: Joi.number().required(),
    recipient: Joi.string().required(),
    publicKey: Joi.string().required(),
    token: Joi.string().required(),
  });

  return transactSchema.validate(body);
};

export const mineValidation = (publicKey: string) => {
  return Joi.string().required().label('Kadocoin wallet address').validate(publicKey);
};
