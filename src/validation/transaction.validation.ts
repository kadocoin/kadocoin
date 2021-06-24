import Joi from "joi";

export const transactValidation = (body: {
  amount: number;
  recipient: string;
}) => {
  const transactSchema = Joi.object().keys({
    amount: Joi.number().positive().required(),
    recipient: Joi.string().required(),
    publicKey: Joi.string().required(),
    token: Joi.string().required(),
  });

  return transactSchema.validate(body, { convert: true });
};

export const mineValidation = (publicKey: string) => {
  return Joi.string()
    .required()
    .label("Kadocoin wallet address")
    .validate(publicKey);
};
