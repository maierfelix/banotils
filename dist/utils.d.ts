/**
 * Converts the provided hex into the equivalent bytes
 * @param hex - The hex to convert
 */
export declare function hexToBytes(hex: string): Uint8Array;
/**
 * Converts the provided bytes into their hexadecimal equivalent
 * @param bytes - The bytes to convert
 */
export declare function bytesToHex(bytes: Uint8Array): string;
/**
 * Converts the provided decimal value into the hexadecimal equivalent
 * @param decimal - The decimal value to convert
 * @param bytes - The byte stride of the provided value
 */
export declare function decimalToHex(decimal: number, bytes: number): string;
/**
 * Indicates if the provided seed is valid
 * @param seed - The seed to check
 */
export declare function isSeedValid(seed: Uint8Array): boolean;
/**
 * Indicates if the provided hash and work bytes are valid
 * @param hash - The hash to validate
 * @param work - The work to validate
 * @param workMin - The minimum value of the work
 */
export declare function isWorkValid(hash: Uint8Array, work: Uint8Array, workMin: bigint): boolean;
/**
 * Converts the provided amount into raw amount
 * @param amount - The amount to convert
 */
export declare function getRawFromAmount(amount: string): bigint;
/**
 * Converts the provided raw amount into amount
 * @param amountRaw - The raw amount to convert
 */
export declare function getAmountFromRaw(amountRaw: bigint): any;
/**
 * Returns the private key of the provided seed
 * @param seed - The seed to derive from
 * @param seedIx - The seed index
 */
export declare function getPrivateKey(seed: Uint8Array, seedIx?: number): Uint8Array;
/**
 * Returns the public key of the provided input
 * @param input - The private key or address to derive from
 */
export declare function getPublicKey(input: (Uint8Array | string)): Uint8Array;
/**
 * Returns the relative address of the public key
 * @param publicKey - The public key to derive the address from
 */
export declare function getAccountAddress(publicKey: Uint8Array): string;
//# sourceMappingURL=utils.d.ts.map