import publicIp from 'public-ip';
import { prod } from '../config/secret';

export default async function address(): Promise<string> {
  // LOCAL DEV - IF PRESENT
  if (!prod) return process.env['CONTACT_IP'] || '';

  // PUBLIC IP ADDRESS OF THE NODE
  return await publicIp.v4();
}
