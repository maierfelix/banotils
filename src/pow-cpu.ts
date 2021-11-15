import blake from "blakejs";

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
export function getWorkCPU(hash: Uint8Array): Uint8Array {
  //return new Promise(resolve => {
  //  worker.postMessage(hash);
  //  worker.onmessage = (e): void => {
  //    resolve(e.data);
  //  };
  //});
  for (let ii = 0; ii < 4096; ++ii) {
    const rand = new Uint8Array(8);
    crypto.getRandomValues(rand);
    for (let r = 0; r < 256; r++) {
      rand[7] = (rand[7] + r) % 256;
      const context = blake.blake2bInit(8);
      blake.blake2bUpdate(context, rand);
      blake.blake2bUpdate(context, hash);
      const work = blake.blake2bFinal(context).reverse();
      if ((work[0] == 255) && (work[1] == 255) && (work[2] == 255) && (work[3] >= 192)) {
        return rand.reverse();
      }
    }
  }
  return new Uint8Array(8);
}
