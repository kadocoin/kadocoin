// Copyright (c) 2009-2010 Adamu Muhammad Dankore

export default function costOfMessage({ message }: { message: string }): number {
  if (!message) return 0;
  return message.length;
}
