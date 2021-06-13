import joi from "joi";
import { IUserModel } from "../models/user";

export const registerValidation = (user: IUserModel) => {
  const userSchema = joi.object({
    email: joi.string().required(),
    password: joi.string().min(3).required()
  });

  return userSchema.validate(user);
};

export const loginValidation = (user: IUserModel) => {
  const loginSchema = joi.object({
    email: joi.string().required(),
    password: joi.string().min(3).required(),
  });

  return loginSchema.validate(user);
};
