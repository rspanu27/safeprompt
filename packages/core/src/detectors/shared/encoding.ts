const BASE64URL = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-_';

/**
 * Decode base64url to an ASCII string, or null if the input isn't valid.
 *
 * Hand-rolled because `atob` lives in the DOM lib and `Buffer` in Node's, and
 * this package is compiled with neither. Non-ASCII bytes return null: the only
 * caller is the JWT header, which is always ASCII JSON.
 */
export function decodeBase64Url(input: string): string | null {
  if (input.length === 0) return null;

  let bits = 0;
  let accumulator = 0;
  let out = '';

  for (const char of input) {
    const value = BASE64URL.indexOf(char);
    if (value === -1) return null;

    accumulator = (accumulator << 6) | value;
    bits += 6;

    if (bits >= 8) {
      bits -= 8;
      const byte = (accumulator >> bits) & 0xff;
      if (byte > 0x7f) return null;
      out += String.fromCharCode(byte);
    }
  }

  return out;
}
