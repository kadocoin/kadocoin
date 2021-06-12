import Joi from 'joi';

export const transactValidation = (body: { amount: string; recipient: string }) => {
  const schema = Joi.object({
    amount: Joi.string().required(),
    recipient: Joi.string().required(),
  });

  return schema.validate(body);
};
