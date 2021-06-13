const MONGODB_CONNECTION: string = process.env.NODE_ENV
  ? process.env.PROD_DATABASE_URL as string
  : process.env.DEV_DATABASE_URL as string;

import mongoose from "mongoose";
export class DBConfig {
  constructor() {
    this.openConnection();
  }

  openConnection = async () => {
    await mongoose
      .connect(MONGODB_CONNECTION, { useNewUrlParser: true, useUnifiedTopology: true })
      .catch(err => {
        console.log(`Oops something went wrong ${err}`);
      });

    console.log(`Success mongoose`);
  };
}
