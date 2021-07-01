import { IUserModel } from "../types";
import { ADMIN_EMAIL } from "../config/secret";
import { nanoid } from "nanoid";
import { Db } from "mongodb";

export default class UserModel {
  async register(
    db: Db,
    { email, hashedPassword, address, userCreationDate, publicKey }: IUserModel
  ): Promise<IUserModel> {
    try {
      return db
        .collection("users")
        .insertOne({
          _id: nanoid(12),
          emailVerified: false,
          profilePicture: "",
          userCreationDate,
          email,
          password: hashedPassword,
          address,
          publicKey,
          name: "",
          bio: "",
          ...(email == `${ADMIN_EMAIL}`
            ? { scope: ["user", "admin"] }
            : { scope: ["user"] }),
          registrationMethod: "email_password",
        })
        .then(({ ops }) => ops[0]);
    } catch (error) {
      throw new Error(`register, ${error}`);
    }
  }
}
