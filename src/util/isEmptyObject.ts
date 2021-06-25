import TransactionPool from "../wallet/transaction-pool";

export default function isEmptyObject(
  obj: Record<any, TransactionPool>
): boolean {
  return Object.keys(obj).length === 0;
}
