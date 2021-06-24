import Web3 from "web3";
import elliptic from "elliptic";

const web3 = new Web3();
const ec = new elliptic.ec("secp256k1");

function pubKeyToAddress(compressedPubkey: string): string {
  const keyPair = ec.keyFromPublic(compressedPubkey, "hex");
  // remove '04' then add prefix '0x'
  const pubkey = "0x" + keyPair.getPublic(false, "hex").substr(2);
  const address = trimFirst12Bytes(web3.utils.keccak256(pubkey));
  return web3.utils.toChecksumAddress(address);
}

function trimFirst12Bytes(hexString: string) {
  return "0x".concat(hexString.substr(hexString.length - 40));
}

export default pubKeyToAddress;
