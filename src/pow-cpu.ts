import blake from "blakejs";
import {bytesToHex} from "./utils";

/**
 * Calculates work for the provided hash
 * @param hash - The hash to generate work for
 */
export function getWorkCPU(hash: Uint8Array): Promise<Uint8Array> {
  return new Promise(resolve => {
    while (true) {
      const work = crypto.getRandomValues(new Uint8Array(8));
      const context = blake.blake2bInit(8);
      blake.blake2bUpdate(context, work);
      blake.blake2bUpdate(context, hash);
      const difficultyBytes = blake.blake2bFinal(context).reverse();
      const difficultyHex = bytesToHex(difficultyBytes);
      const difficulty: bigint = BigInt(`0x${difficultyHex}`);
      if (difficulty >= 0xFFFFFE0000000000n) {
        return resolve(work.reverse());
      }
    }
  });
}
