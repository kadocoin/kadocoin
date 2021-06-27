import cryptoHash from "./crypto-hash";
import newEc from "./secp256k1";

interface IVerifySignatureProps {
  publicKey: string;
  data: any;
  signature: string;
}

export default function verifySignature({
  publicKey,
  data,
  signature,
}: IVerifySignatureProps): boolean {
  const keyFromPublic = newEc.keyFromPublic(publicKey, "hex");

  return keyFromPublic.verify(cryptoHash(data), signature);
}
