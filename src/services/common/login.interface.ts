import { Db } from "mongodb";

export interface LoginInterface<T> {
  findByEmail(db: Db, email: string): Promise<T | null>;
}
