import crypto from "./polyfills/crypto";
import blake from "blakejs";
import {deriveAddressFromPublicKey, derivePublicKeyFromAddress, derivePublicKeyFromPrivateKey} from "./crypto";

const SEED_ALPHABET_REGEX = new RegExp(`^[0123456789abcdefABCDEF]{64}$`);

/**
 * Clamps the provided number between the given min/max range
 * @param num - The number to clamp
 * @param min - The minimum clamp bound
 * @param max - The maximum clamp bound
 */
export function clamp(num: number, min: number, max: number): number {
  return Math.max(min, Math.min(num, max));
}

/**
 * Converts the provided hex into the equivalent bytes
 * @param hex - The hex to convert
 */
export function hexToBytes(hex: string): Uint8Array {
  const result = new Uint8Array(hex.length / 2);
  for (let ii = 0; ii < result.length; ++ii) {
    result[ii] = parseInt(hex.substring((ii * 2) + 0, (ii * 2) + 2), 16);
  }
  return result;
}

/**
 * Converts the provided bytes into their hexadecimal equivalent
 * @param bytes - The bytes to convert
 */
export function bytesToHex(bytes: Uint8Array): string {
  return Array.prototype.map.call(bytes, (x) => ("00" + x.toString(16)).slice(-2)).join("").toUpperCase();
}

/**
 * Converts the provided bits into their byte equivalent
 * @param bits - The bits to convert
 * @param byteStride - An optional byte stride
 */
export function bitsToByte(bits: Uint8Array, byteStride: number = 8): number {
  let byte = 0;
  for (let bb = byteStride - 1; bb >= 0; --bb) {
    byte |= (bits[bb] << bb);
  }
  return byte;
}

/**
 * Converts the provided byte into it's bit equivalent
 * @param byte - The byte to convert
 * @param byteStride - An optional byte stride
 */
export function byteToBits(byte: number, byteStride: number = 8): Uint8Array {
  const bits = new Uint8Array(byteStride);
  for (let bb = byteStride - 1; bb >= 0; --bb) {
    bits[byteStride - 1 - bb] = byte & (1 << bb) ? 1 : 0;
  }
  return bits;
}

/**
 * Converts the provided bytes into their bit equivalent
 * @param bytes - The bytes to convert
 */
export function bytesToBits(bytes: Uint8Array): Uint8Array {
  const bits = new Uint8Array(bytes.length * 8);
  for (let ii = 0; ii < bytes.length; ++ii) {
    const b = byteToBits(bytes[ii], 8);
    for (let bb = 0; bb < 8; ++bb) {
      bits[(ii * 8) + bb] = b[bb];
    }
  }
  return bits;
}

/**
 * Converts the provided 1-d bits into N-d bits
 * @param bitsn - The 1-d bits to convert
 * @param bitStride - The bit stride to use
 */
export function bitsToBitsN(bits: Uint8Array, bitStride: number): Uint8Array {
  const output = new Uint8Array(Math.ceil(bits.length / bitStride));
  for (let ii = 0; ii < output.length; ++ii) {
    output[ii] = bitsToByte(bits.subarray((ii * bitStride) + 0, (ii * bitStride) + bitStride), bitStride);
  }
  return output;
}

/**
 * Converts the provided N-d bits into 1-d bits
 * @param bitsn - The N-d bits to convert
 * @param bitStride - The bit stride to use
 */
export function bitsNToBits(bitsn: Uint8Array, bitStride: number): Uint8Array {
  const output = new Uint8Array(Math.floor(bitsn.length * bitStride));
  for (let ii = 0; ii < bitsn.length; ++ii) {
    const bits = byteToBits(bitsn[ii], bitStride);
    for (let bb = 0; bb < bitStride; ++bb) {
      output[(ii * bitStride) + bb] = bits[bitStride - 1 - bb];
    }
  }
  return output;
}

/**
 * Converts the provided decimal value into the hexadecimal equivalent
 * @param decimal - The decimal value to convert
 * @param bytes - The byte stride of the provided value
 */
export function decimalToHex(decimal: number, bytes: number): string {
  const dec = decimal.toString().split("");
  const sum = [];
  let hex = "";
  const hexArray = [];
  while (dec.length) {
    let s = 1 * Number(dec.shift());
    for (let ii = 0; s || ii < sum.length; ++ii) {
      s += (sum[ii] || 0) * 10;
      sum[ii] = s % 16;
      s = (s - sum[ii]) / 16;
    }
  }
  while (sum.length) {
    hexArray.push(sum.pop().toString(16));
  }

  hex = hexArray.join("");
  if (hex.length % 2 != 0) hex = "0" + hex;

  if (bytes > hex.length / 2) {
    const diff = bytes - (hex.length / 2);
    for (let j = 0; j < diff; j++) {
      hex = "00" + hex;
    }
  }

  return hex;
}

/**
 * Indicates if the provided seed is valid
 * @param seed - The seed to check
 */
export function isSeedValid(seed: Uint8Array): boolean {
  return SEED_ALPHABET_REGEX.test(bytesToHex(seed));
}

/**
 * Indicates if the provided hash and work bytes are valid
 * @param hash - The hash to validate
 * @param work - The work to validate
 * @param workMin - The minimum value of the work
 */
export function isWorkValid(hash: Uint8Array, work: Uint8Array, workMin: bigint): boolean {
  const context = blake.blake2bInit(8);
  blake.blake2bUpdate(context, work);
  blake.blake2bUpdate(context, hash);
  const output = blake.blake2bFinal(context).reverse();
  const outputHex = bytesToHex(output);
  const outputBigInt = BigInt("0x" + outputHex);
  return outputBigInt > workMin;
}

/**
 * Converts the provided amount into raw amount
 * @param amount - The amount to convert
 */
export function getRawFromAmount(amount: string): bigint {
  const decimalPlace = amount.indexOf(".");
  let divisor = BigInt("1");
  if (decimalPlace !== -1) {
    amount = amount.replace(".", "");
    const decimalsAfter = amount.length - decimalPlace;
    divisor = BigInt("10") ** BigInt(decimalsAfter);
  }
  const amountBi = BigInt(amount);
  const majorDivisor = BigInt(`100000000000000000000000000000`);
  const amountRaw = (amountBi * majorDivisor) / divisor;
  return amountRaw;
}

/**
 * Converts the provided raw amount into amount
 * @param amountRaw - The raw amount to convert
 */
export function getAmountFromRaw(amountRaw: bigint): any {
  const minorDivisor = BigInt(`1000000000000000000000000000`);
  const majorDivisor = BigInt(`100000000000000000000000000000`);
  const major = amountRaw / majorDivisor;
  const majorRawRemainder = amountRaw - (major * majorDivisor);
  const minor = majorRawRemainder / minorDivisor;
  const banano = major.toString();
  const banoshi = minor.toString();
  const amount = banano + "." + banoshi.padStart(2, "0");
  return amount;
}

/**
 * Returns the private key of the provided seed
 * @param seed - The seed to derive from
 * @param seedIx - The seed index
 */
export function getPrivateKey(seed: Uint8Array, seedIx: number = 0): Uint8Array {
  if (!isSeedValid(seed)) throw new Error(`Invalid seed '${seed}'`);
  const accountBytes = hexToBytes(decimalToHex(seedIx, 4));
  const context = blake.blake2bInit(32);
  blake.blake2bUpdate(context, seed);
  blake.blake2bUpdate(context, accountBytes);
  return blake.blake2bFinal(context);
}

/**
 * Returns the public key of the provided input
 * @param input - The private key or address to derive from
 */
export function getPublicKey(input: (Uint8Array | string)): Uint8Array {
  // Get public key from address string
  if (typeof input === "string") {
    return derivePublicKeyFromAddress(input);
  }
  // Get public key from private key array
  return derivePublicKeyFromPrivateKey(input);
}

/**
 * Returns the relative address of the public key
 * @param publicKey - The public key to derive the address from
 */
export function getAccountAddress(publicKey: Uint8Array): string {
  return deriveAddressFromPublicKey(bytesToHex(publicKey));
}

/**
 * Encrypts the provided hash with the given password
 * @param hash - The hash to encrypt
 * @param password - The password to encrypt the hash with
 * @param iv - An optional initialization vector to encrypt with
 */
export async function encryptHash(hash: Uint8Array, password: string, iv: Uint8Array = null): Promise<Uint8Array> {
  const passwordBytes = new TextEncoder().encode(password);
  const passwordKey = await crypto.subtle.importKey(
    "raw",
    passwordBytes, {name: "PBKDF2"},
    false, ["deriveBits", "deriveKey"]
  );
  const key = await crypto.subtle.deriveKey(
    {name: "PBKDF2", iterations: 100000, salt: new Uint8Array(16), hash: "SHA-256"},
    passwordKey, {name: "AES-GCM", length: 256},
    true,
    ["encrypt", "decrypt"]
  );
  const encrypted = await crypto.subtle.encrypt(
    {name: "AES-GCM", iv: iv || new Uint8Array(12)},
    key,
    hash
  );
  return new Uint8Array(encrypted);
}

/**
 * Decrypts the provided encrypted hash with the given password
 * @param hash - The hash to decrypt
 * @param password - The password to decrypt the hash with
 * @param iv - An optional initialization vector to decrypt with
 */
export async function decryptHash(hash: Uint8Array, password: string, iv: Uint8Array = null): Promise<Uint8Array> {
  const passwordBytes = new TextEncoder().encode(password);
  const passwordKey = await crypto.subtle.importKey(
    "raw",
    passwordBytes, {name: "PBKDF2"},
    false, ["deriveBits", "deriveKey"]
  );
  const key = await crypto.subtle.deriveKey(
    {name: "PBKDF2", iterations: 100000, salt: new Uint8Array(16), hash: "SHA-256"},
    passwordKey, {name: "AES-GCM", length: 256},
    true,
    ["encrypt", "decrypt"]
  );
  try {
    const decrypted = await crypto.subtle.decrypt(
      {name: "AES-GCM", iv: iv || new Uint8Array(12)},
      key,
      hash
    );
    return new Uint8Array(decrypted);
  } catch(e) {}
  return null;
}
