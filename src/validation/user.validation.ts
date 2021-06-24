import Joi from "joi";
import { IUserModel } from "../types";

export const registerValidation = (user: IUserModel) => {
  const regSchema = Joi.object({
    email: Joi.string().email().required(),
    password: Joi.string().min(6).required(),
    userCreationDate: Joi.string(),
  });

  return regSchema.validate(user);
};

export const emailValidation = (email: string) => {
  return Joi.string().email().label("Email").validate(email);
};

export const loginValidation = (user: IUserModel) => {
  const loginSchema = Joi.object({
    email: Joi.string().email().required(),
    password: Joi.string().min(6).required(),
  });

  return loginSchema.validate(user);
};

export const walletInfoValidation = (address: string) => {
  const walletInfoSchema = Joi.object({
    address: Joi.string().required(),
    token: Joi.string().required(),
  });

  return walletInfoSchema.validate(address);
};
