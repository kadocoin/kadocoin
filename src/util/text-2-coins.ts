// Copyright (c) 2009-2010 Adamu Muhammad Dankore

export default function costOfMessage({ message }: { message: string }): number | null {
  if (!message) return null;
  return message.length;
}
