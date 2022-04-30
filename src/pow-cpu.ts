import * as nanpow from "nanpow";

/**
 * Calculates work on the CPU for the provided hash
 * @param hash - The hash to calculate work for
 * @param difficulty - The difficulty of the work to calculate
 */
export function getWorkCPU(hash: Uint8Array, difficulty: number): Promise<Uint8Array> {
  return new Promise(resolve => {
    nanpow.getWork(hash, difficulty).then(resolve);
  });
}
