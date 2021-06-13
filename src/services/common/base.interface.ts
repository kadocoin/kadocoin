import { Db } from 'mongodb';

export interface BaseInterface<T> {
  save(db: Db, model: T): Promise<T>;
  update(_id: string, model: T): Promise<T | null>;
  delete(_id: string): Promise<Boolean>;
  findById(_id: string): Promise<T | null>;
  findAll(): Promise<T[]>;
}
