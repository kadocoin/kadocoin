export default function size(...inputs: any[]): string {
  const chainLength = inputs
    .map(input => JSON.stringify(input))
    .join('')
    .replace(/[\[\]\,\"{}]/g, '').length;

  return chainLength.toLocaleString('en-US');
}
