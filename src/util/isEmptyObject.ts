export default function isEmptyObject(obj: { obj: unknown }): boolean {
  return Object.keys(obj).length === 0;
}
