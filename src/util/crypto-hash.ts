import crypto from "crypto";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const cryptoHash = (...inputs: any[]): string => {
  const hash = crypto.createHash("sha256");

  hash.update(
    inputs
      .map((input) => JSON.stringify(input))
      .sort()
      .join(" ")
  );

  return hash.digest("hex");
};

export default cryptoHash;
