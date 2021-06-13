import { Db } from 'mongodb';

export interface CommonInterface<T> {
  findByEmail(db: Db, email: string): Promise<T | null>;
}
