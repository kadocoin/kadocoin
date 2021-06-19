export default function isEmptyObject(obj: { obj: unknown }) {
  return Object.keys(obj).length === 0;
}
