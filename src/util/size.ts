export default function size(...inputs: any[]): string {
  const chainLength = JSON.stringify(inputs).replace(/[\[\]\,\"{}]/g, '').length;

  return chainLength.toLocaleString('en-US');
}
