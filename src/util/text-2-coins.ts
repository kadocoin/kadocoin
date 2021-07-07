// MIT License
// Copyright (c) Adamu Muhammad Dankore
export default function costOfMessage({ message }: { message: string }): number {
  if (!message) return 0;
  return message.length;
}
