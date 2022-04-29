import * as nanpow from "nanpow";

/**
 * Calculates work on the CPU for the provided hash
 * @param hash - The hash to calculate work for
 */
export function getWorkCPU(hash: Uint8Array): Promise<Uint8Array> {
  return new Promise(resolve => {
    nanpow.getWork(hash).then(resolve);
  });
}
