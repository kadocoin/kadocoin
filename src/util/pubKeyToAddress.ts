import Web3 from "web3";

const web3 = new Web3();

export function pubKeyToAddress(publicKey: string): string {
  const address = trimFirst12Bytes(web3.utils.keccak256(publicKey));
  // console.log({ address, publicKey });
  return web3.utils.toChecksumAddress(address);
}

function trimFirst12Bytes(hexString: string): string {
  return "0x".concat(hexString.substr(hexString.length - 40));
}

export function isValidChecksumAddress(address: string): boolean {
  return Web3.utils.isAddress(address);
}
