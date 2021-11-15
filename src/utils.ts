import blake from "blakejs";
import {deriveAddressFromPublicKey, derivePublicKeyFromAddress, derivePublicKeyFromPrivateKey} from "./crypto";

const SEED_ALPHABET_REGEX = new RegExp(`^[0123456789abcdefABCDEF]{64}$`);

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
