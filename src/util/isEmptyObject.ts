import { TDataChild } from "../types";
import Transaction from "../wallet/transaction";
import TransactionPool from "../wallet/transaction-pool";

export default function isEmptyObject(
  obj: Record<string, Transaction | TDataChild>
): boolean {
  return Object.keys(obj).length === 0;
}
