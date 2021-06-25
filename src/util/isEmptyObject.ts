export default function isEmptyObject(obj: any): boolean {
  return Object.keys(obj).length === 0;
}
