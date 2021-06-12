import { ec } from 'elliptic';
import cryptoHash from './crypto-hash';

const newEc = new ec('secp256k1');

interface IVerifySignatureProps {
  publicKey: string;
  data: any;
  signature: string;
}

const verifySignature = ({ publicKey, data, signature }: IVerifySignatureProps) => {
  const keyFromPublic = newEc.keyFromPublic(publicKey, 'hex');

  return keyFromPublic.verify(cryptoHash(data), signature);
};

export { newEc, verifySignature, cryptoHash };
