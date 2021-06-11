import joi from "joi";
import { UserModel } from "../models/user";

export const registerValidation = (user: UserModel) => {
  const userSchema = joi.object({
    firstName: joi.string().min(3).required(),
    lastName: joi.string().min(3).required(),
    email: joi.string().required(),
    password: joi.string().min(3).required(),
    userImageUrl: joi.string().required(),
  });

  return userSchema.validate(user);
};

export const loginValidation = (user: UserModel) => {
  const loginSchema = joi.object({
    email: joi.string().required(),
    password: joi.string().min(3).required(),
  });

  return loginSchema.validate(user);
};
