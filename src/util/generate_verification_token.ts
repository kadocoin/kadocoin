import crypto from 'crypto';
export function generate_verification_token(): Promise<string> {
  return new Promise((resolve, reject) => {
    crypto.randomBytes(20, (err, buf) => {
      if (buf) {
        const token = buf.toString('hex');
        resolve(token);
      } else {
        reject(err);
      }
    });
  });
}

export function token_expiry_ms(): number {
  return Date.now() + 60 * 60 * 1000; // 1 hour
}
