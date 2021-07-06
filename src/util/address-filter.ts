export function filterAddress(mixedAddress: string): string {
  // param example - "msg-fee-0xC6d23c6703f33F5ad74E6E4fc17C1CE9397D4AAD"
  return mixedAddress.split('msg-fee-')[1];
}
