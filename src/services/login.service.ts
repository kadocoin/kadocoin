import { Model } from "mongoose";
import { UserModel } from "../models/user";
import { userSchema } from "../schemas/user.schemas";
import { LoginInterface } from "./common/login.interface";

export class LoginService implements LoginInterface<UserModel> {
  private user: Model<UserModel>;

  constructor() {
    this.user = userSchema;
  }

  findByEmail = async (email: string): Promise<UserModel | null> => {
    return await this.user.findOne({ email: email });
  };
}
