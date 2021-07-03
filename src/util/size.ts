import { IChain } from '../types';

export default function size(chain: IChain): string {
  const chainLength = JSON.stringify(chain).replace(/[\[\]\,\"{}]/g, '').length;

  return chainLength.toLocaleString('en-US');
}
