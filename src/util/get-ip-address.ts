import publicIp from 'public-ip';
import { prod } from '../settings';

export default async function ip_address(): Promise<string> {
  // LOCAL DEV - IF PRESENT
  if (!prod) return process.env['IP_ADDRESS'] || process.env.IP_ADDRESS;

  // PUBLIC IP ADDRESS OF THE NODE
  return await publicIp.v4();
}
