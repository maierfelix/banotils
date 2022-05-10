import {bytesToHex, getPublicKey, hexToBytes, isWorkValid} from "./utils";

import fetch from "cross-fetch";
import blake from "blakejs";

import {getAccountAddress} from "./utils";
import {signHash} from "./crypto";

import {IAccountBalanceResponse, parseAccountBalanceResponse} from "./rpc/account-balance";
import {IAccountHistoryResponse, parseAccountHistoryResponse} from "./rpc/account-history";
import {IAccountInfoResponse, parseAccountInfoResponse} from "./rpc/account-info";
import {IAccountPendingResponse, parseAccountPendingResponse} from "./rpc/account-pending";
import {IAccountRepresentativeResponse, parseAccountRepresentativeResponse} from "./rpc/account-representative";
import {IBlockProcessResponse, parseBlockProcessResponse} from "./rpc/block-process";
import {IWorkGenerateResponse, parseWorkGenerateResponse} from "./rpc/work-generate";
import {getWorkCPU} from "./pow-cpu";
import {getWorkGPU} from "./pow-gpu";
import {WORK_DIFFICULTY} from "./config";

export * from "./mnemonic";
export * from "./pow-cpu";
export * from "./pow-gpu";
export * from "./qr-code";
export * from "./utils";

const IS_WEBGL2_SUPPORTED = isWebGL2Supported();
const IS_WEBASSEMBLY_SUPPORTED = isWebAssemblySupported();

const MIN_WEBGL_TEXTURE_SIZE = 2048;

let IS_SERVER_WORK_SUPPORTED = false;

/**
 * The supported PoW generation modes
 */
export enum PROOF_OF_WORK_MODE {
  AUTO,
  GPU,
  CPU,
  NODE,
}

// Global state
let nodeAPIUrl = ``;
let proofOfWorkMode = PROOF_OF_WORK_MODE.AUTO;
let proofOfWorkDifficulty = WORK_DIFFICULTY;

/**
 * Indicates if WebGL2 is supported
 */
function isWebGL2Supported(): boolean {
  try {
    if (typeof document !== "undefined") {
      const canvas = document.createElement("canvas");
      if (typeof WebGL2RenderingContext !== "undefined") {
        const gl = canvas.getContext("webgl2");
        if (gl !== null) {
          if (gl.getParameter(gl.MAX_TEXTURE_SIZE) >= MIN_WEBGL_TEXTURE_SIZE) {
            return true;
          }
        }
      }
    }
  } catch (e) { }
  return false;
}

/**
 * Indicates if WebAssembly is supported
 */
function isWebAssemblySupported(): boolean {
  try {
    if (typeof WebAssembly !== "undefined") {
      return true;
    }
  } catch (e) { }
  return false;
}

/**
 * Submits a POST request to a node
 * @param data - The form data to send
 */
function request(data: any): Promise<any> {
  // Validate API URL
  if (!nodeAPIUrl) throw new Error(`API URL is invalid`);
  // Perform request
  return new Promise((resolve) => {
    try {
      fetch(nodeAPIUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify(data)
      }).then(response => {
        try {
          response.json().then(json => {
            resolve(json);
          }).catch(() => {
            resolve({error: "Request failed"});
          });
        } catch (e) {
          resolve({error: "Request failed"});
        }
      }).catch(() => {
        resolve({error: "Request failed"});
      });
    } catch (e) {
      resolve({error: "Request failed"});
    }
  });
}

/**
 * Indicates if the responded json is valid
 * @param json - The json to check
 */
function isValidJSONResponse(json: any): boolean {
  return json ? !json.hasOwnProperty("error") : false;
}

/**
 * Generates proof of work for the provided hash
 * @param hash - The hash to generate work for
 * @param mode - Optional proof of work mode to use
 */
export async function generateProofOfWork(hash: Uint8Array, mode: PROOF_OF_WORK_MODE): Promise<Uint8Array> {
  let work: Uint8Array = null;
  // Auto work mode
  if (mode === PROOF_OF_WORK_MODE.AUTO) {
    // Use GPU work generation if available
    if (IS_WEBGL2_SUPPORTED) work = await getWorkGPU(hash, proofOfWorkDifficulty);
    // Use NODE work generation if available
    else if (IS_SERVER_WORK_SUPPORTED) work = (await getWorkNODE(hash)).work;
    // Use CPU work generation if available
    else if (IS_WEBASSEMBLY_SUPPORTED) work = await getWorkCPU(hash, proofOfWorkDifficulty);
  }
  // GPU work mode
  else if (mode === PROOF_OF_WORK_MODE.GPU) {
    if (IS_WEBGL2_SUPPORTED) work = await getWorkGPU(hash, proofOfWorkDifficulty);
  }
  // CPU work mode
  else if (mode === PROOF_OF_WORK_MODE.CPU) {
    if (IS_WEBASSEMBLY_SUPPORTED) work = await getWorkCPU(hash, proofOfWorkDifficulty);
  }
  // NODE work mode
  else if (mode === PROOF_OF_WORK_MODE.NODE) {
    if (IS_SERVER_WORK_SUPPORTED) work = (await getWorkNODE(hash)).work;
  }
  else {
    throw new Error(`Invalid work generation mode '${mode}'`);
  }
  // Throw if work generation failed
  if (work === null) throw new Error(`Work generation failed`);
  // Validate the generated work
  if (!isWorkValid(hash, work, BigInt(WORK_DIFFICULTY))) throw new Error(`Generated work '${bytesToHex(work)}' is invalid`);
  return work;
}

/**
 * Returns the hash of provided block
 * @param block - The block to hash
 */
function hashBlock(block: any): Uint8Array {
  let balanceToPad = BigInt(block.balance).toString(16);
  while (balanceToPad.length < 32) {
    balanceToPad = "0" + balanceToPad;
  }
  const context = blake.blake2bInit(32, null);
  blake.blake2bUpdate(context, hexToBytes(`0000000000000000000000000000000000000000000000000000000000000006`));
  blake.blake2bUpdate(context, getPublicKey(block.account));
  blake.blake2bUpdate(context, hexToBytes(block.previous));
  blake.blake2bUpdate(context, getPublicKey(block.representative));
  blake.blake2bUpdate(context, hexToBytes(balanceToPad));
  blake.blake2bUpdate(context, hexToBytes(block.link));
  const hash = blake.blake2bFinal(context);
  return hash;
}

/**
 * Generates a process block
 * @param privateKey - The private key to sign the block
 * @param previousHash - The hash of the previous block
 * @param representative - The representative to link to the block
 * @param hash - The hash to process
 * @param balance - The account balance after the block got processed
 */
async function generateProcessBlock(privateKey: Uint8Array, previousHash: (Uint8Array | null), representative: Uint8Array, hash: Uint8Array, balance: bigint): Promise<any> {
  const publicKey = getPublicKey(privateKey);

  // Generate proof-of-work for the block
  const work = await generateProofOfWork(previousHash || publicKey, proofOfWorkMode);

  // Build the block
  const block: any = {};
  block.type = "state";
  block.account = getAccountAddress(publicKey);
  block.previous = bytesToHex(previousHash || new Uint8Array(32));
  block.representative = getAccountAddress(representative);
  block.balance = balance.toString(10);
  block.work = bytesToHex(work);
  block.link = bytesToHex(hash);
  block.signature = bytesToHex(signHash(privateKey, hashBlock(block)));

  return block;
}

/**
 * Sets the API URL of the node to perform requests with
 */
export async function setAPIURL(url: string): Promise<void> {
  // Validate API URL
  if (url.startsWith("https") || url.startsWith("http")) {
    nodeAPIUrl = url;
  } else {
    throw new Error(`Invalid API URL`);
  }
  // Arbitrary existing block hash to get work for
  const hash = hexToBytes(`8711A7FCA0F2CDBBA739FBB7948C9AEFCA509931A50EC0922FF0DC3737708E93`);
  // Test it the API node supports work generation
  const result = await getWorkNODE(hash);
  if (result !== null && result.work instanceof Uint8Array && isWorkValid(hash, result.work, BigInt(WORK_DIFFICULTY))) {
    IS_SERVER_WORK_SUPPORTED = true;
  }
}

/**
 * Returns the API URL of the used node
 */
export function getAPIURL(): string {return nodeAPIUrl;}

/**
 * Sets the provided proof of work mode
 * @param mode - The proof of work mode to use
 */
export function setProofOfWorkMode(mode: PROOF_OF_WORK_MODE): void {
  proofOfWorkMode = mode;
}

/**
 * Returns the used proof of work mode
 */
export function getProofOfWorkMode(): PROOF_OF_WORK_MODE {return proofOfWorkMode;}

/**
 * Sets the provided proof of work difficulty
 * @param difficulty - The proof of work difficulty to use
 */
export function setProofOfWorkDifficulty(difficulty: number): void {
  proofOfWorkDifficulty = difficulty;
}

/**
 * Returns the used proof of work difficulty
 */
export function getProofOfWorkDifficulty(): number {return proofOfWorkDifficulty;}

/**
 * Manually send a RPC request
 * @param data - The request data to send
 */
export async function fetchRPC(data: any): Promise<any> {
  const json = await request(data);
  if (!isValidJSONResponse(json)) return null;
  return json;
}

/**
 * Calculates work on the NODE for the provided hash
 * @param hash - The hash to calculate work for
 */
export async function getWorkNODE(hash: Uint8Array): Promise<IWorkGenerateResponse> {
  const json = await request({
    action: "work_generate",
    hash: bytesToHex(hash),
  });
  if (!isValidJSONResponse(json)) return null;
  return parseWorkGenerateResponse(json);
}

/**
 * Returns the info of the provided account
 * @param publicKey - The public key of the account to query for
 */
export async function getAccountInfo(publicKey: Uint8Array): Promise<IAccountInfoResponse> {
  const accountAddress = getAccountAddress(publicKey);
  const json = await request({
    action: "account_info",
    account: accountAddress,
  });
  if (!isValidJSONResponse(json)) return null;
  return parseAccountInfoResponse(json);
}

/**
 * Returns the balance of the provided account
 * @param publicKey - The public key of the account to query for
 */
export async function getAccountBalance(publicKey: Uint8Array): Promise<IAccountBalanceResponse> {
  const accountAddress = getAccountAddress(publicKey);
  const json = await request({
    action: "accounts_balances",
    accounts: [accountAddress],
  });
  if (!isValidJSONResponse(json)) return null;
  return parseAccountBalanceResponse(json);
}

/**
 * Returns the representative of the provided account
 * @param publicKey - The public key of the account to query for
 */
export async function getAccountRepresentative(publicKey: Uint8Array): Promise<IAccountRepresentativeResponse> {
  const accountAddress = getAccountAddress(publicKey);
  const json = await request({
    action: "account_representative",
    account: accountAddress,
  });
  if (!isValidJSONResponse(json)) return null;
  return parseAccountRepresentativeResponse(json);
}

/**
 * Returns the history of the provided account
 * @param publicKey - The public key of the account to query for
 * @param count - Optional limit of history items to query
 * @param reverse - Optionally query history items in reverse order
 * @param head - Optional block head to start querying at
 */
export async function getAccountHistory(publicKey: Uint8Array, count: number = -1, reverse: boolean = false, head: Uint8Array = null): Promise<IAccountHistoryResponse> {
  const accountAddress = getAccountAddress(publicKey);
  const data: any = {
    action: "account_history",
    account: accountAddress,
    count: count,
    raw: false
  };
  if (head !== null) data.head = bytesToHex(head);
  if (reverse) data.reverse = true;
  const json = await request(data);
  if (!isValidJSONResponse(json)) return null;
  return parseAccountHistoryResponse(json);
}

/**
 * Returns the pending blocks of the provided account
 * @param publicKey - The public key of the account to query for
 * @param count - Optional limit of pending blocks to query
 * @param threshold - Optional minimum threshold of the pending blocks to query
 */
export async function getAccountPending(publicKey: Uint8Array, count: number = -1, threshold: bigint = 0n): Promise<IAccountPendingResponse> {
  const accountAddress = getAccountAddress(publicKey);
  const json = await request({
    action: "accounts_pending",
    accounts: [accountAddress],
    count: count,
    threshold: threshold.toString(10),
    source: true,
  });
  if (!isValidJSONResponse(json)) return null;
  return parseAccountPendingResponse(json);
}

/**
 * Open an account that is currently unopened
 * @param privateKey - The private key of the account
 * @param representative - The representative to link to the account
 * @param pendingHash - The pending hash to open with
 * @param pendingAmount - The pending amount to open with
 */
export async function openAccount(privateKey: Uint8Array, representative: Uint8Array, pendingHash: Uint8Array, pendingAmount: bigint): Promise<IBlockProcessResponse> {
  const previousHash: Uint8Array = null;
  const block = await generateProcessBlock(privateKey, previousHash, representative, pendingHash, pendingAmount);
  // Submit block to the blockchain
  const json = await request({
    "action": "process",
    "json_block": "true",
    "subtype": "open",
    "block": block,
  });
  if (!isValidJSONResponse(json)) return null;
  return parseBlockProcessResponse(json);
}

/**
 * Receive a pending deposit for the given account
 * @param privateKey - The private key of the account
 * @param representative - The representative to link to the account
 * @param pendingHash - The pending hash to receive
 * @param pendingAmount - The pending amount to receive
 */
export async function receiveAccount(privateKey: Uint8Array, representative: Uint8Array, pendingHash: Uint8Array, pendingAmount: bigint): Promise<IBlockProcessResponse> {
  const publicKey = getPublicKey(privateKey);
  const accountHistory = await getAccountHistory(publicKey);
  const accountBalance = await getAccountBalance(publicKey);

  // Open account if it doesn't have history
  if (!accountHistory || accountHistory.history.length == 0) {
    return openAccount(privateKey, representative, pendingHash, pendingAmount);
  }

  const balance = (pendingAmount + accountBalance.balance);
  const previousHash = (await getAccountInfo(publicKey)).frontier;
  const block = await generateProcessBlock(privateKey, previousHash, representative, pendingHash, balance);

  // Submit block to the blockchain
  const json = await request({
    "action": "process",
    "json_block": "true",
    "subtype": "receive",
    "block": block,
  });
  if (!isValidJSONResponse(json)) return null;
  return parseBlockProcessResponse(json);
}

/**
 * Send amount to the given the account
 * @param srcPrivateKey - The private key of the sender account
 * @param dstPublicKey - The public key of the receiver account
 * @param representativePublicKey - The public key of the representative account to use
 * @param amount - The amount to send
 */
export async function sendAccount(srcPrivateKey: Uint8Array, dstPublicKey: Uint8Array, representativePublicKey: Uint8Array, amount: bigint): Promise<IBlockProcessResponse> {
  const srcPublicKey = getPublicKey(srcPrivateKey);
  const srcAccountInfo = await getAccountInfo(srcPublicKey);
  const srcAccountBalance = await getAccountBalance(srcPublicKey);
  //const srcAccountRepresentative = await getAccountRepresentative(srcPublicKey);

  const balance = srcAccountBalance.balance - amount;
  if (srcAccountBalance.balance <= 0n || balance < 0n) return null;

  const previousHash = srcAccountInfo.frontier;
  const block = await generateProcessBlock(srcPrivateKey, previousHash, representativePublicKey, dstPublicKey, balance);

  // Submit block to the blockchain
  const json = await request({
    "action": "process",
    "json_block": "true",
    "subtype": "send",
    "block": block,
  });
  if (!isValidJSONResponse(json)) return null;
  return parseBlockProcessResponse(json);
}
