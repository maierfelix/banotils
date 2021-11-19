import blake from "blakejs";
import { bytesToHex } from "./utils";
import { EPOCH1_MIN_DIFFICULTY } from "./constants";

//function WorkerCode(): void {
//  (self as any).addEventListener("message", (e: MessageEvent): void => {
//    postMessage(e.data);
//  });
//}
//
//const WORKER_CPU_CODE = WorkerCode.toString() + "; WorkerCode();";
//
//const workerBlob = new Blob([WORKER_CPU_CODE]);
//const workerURL = URL.createObjectURL(workerBlob);
//const worker = new Worker(workerURL);

/**
 * Calculates work for the provided hash
 * @param hash - The hash to generate work for
 */
export function getWorkCPU(hash: Uint8Array, minDifficulty: bigint = EPOCH1_MIN_DIFFICULTY): Uint8Array {
  while(true) {
    const workBytes = new Uint8Array(8);
    crypto.getRandomValues(workBytes);
    const context = blake.blake2bInit(8);
    blake.blake2bUpdate(context, workBytes);
    blake.blake2bUpdate(context, hash);
    const difficultyBytes = blake.blake2bFinal(context).reverse();
    const difficultyHex = bytesToHex(difficultyBytes);
    const difficulty: bigint = BigInt(`0x${difficultyHex}`);

    if (difficulty >= minDifficulty) {
      return workBytes;
    }
  }
}
