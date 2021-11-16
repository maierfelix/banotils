/**
 * Converts the provided entropy into an equivalent mnemonic
 * @param entropy - The entropy to convert
 */
export declare function entropyToMnemonic(entropy: Uint8Array): Promise<string>;
/**
 * Converts the provided mnemonic into it's equivalent entropy
 * @param mnemonic - The mnemonic to convert
 */
export declare function mnemonicToEntropy(mnemonic: string): Promise<Uint8Array>;
//# sourceMappingURL=mnemonic.d.ts.map