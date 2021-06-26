import { Db } from "mongodb";
import { IUserModel } from "../types";

export default class CommonModel {
  findByEmail = async (db: Db, email: string): Promise<IUserModel> => {
    try {
      return db
        .collection("users")
        .findOne({
          email,
        })
        .then((user) => user || null);
    } catch (error) {
      console.log("findByEmail", error);
    }
  };

  findById = async (db: Db, id: string): Promise<IUserModel> => {
    try {
      return db
        .collection("users")
        .findOne({
          _id: id,
        })
        .then((user) => user || null);
    } catch (error) {
      console.log("findById", error);
    }
  };

  // END CLASS
}
