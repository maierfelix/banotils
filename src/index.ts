import {bytesToHex, getPublicKey, hexToBytes, isWorkValid} from "./utils";

import blake from "blakejs";

import {getAccountAddress} from "./utils";

import {IAccountBalanceResponse, parseAccountBalanceResponse} from "./rpc/account-balance";
import {IAccountHistoryResponse, parseAccountHistoryResponse} from "./rpc/account-history";
import {IAccountInfoResponse, parseAccountInfoResponse} from "./rpc/account-info";
import {IAccountPendingResponse, parseAccountPendingResponse} from "./rpc/account-pending";
import {IAccountRepresentativeResponse, parseAccountRepresentativeResponse} from "./rpc/account-representative";
import {getWorkGPU} from "./pow-gpu";
import {signHash} from "./crypto";
import {IBlockProcessResponse, parseBlockProcessResponse} from "./rpc/block-process";

export * from "./utils";

let API_URL = ``;

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
 * Generates proof of work for the provided hash (Currently only supports running on the GPU)
 * @param hash - The hash to generate work for
 */
async function generateProofOfWork(hash: Uint8Array): Promise<Uint8Array> {
  const work = await getWorkGPU(hash);
  if (!isWorkValid(hash, work, 0xFFFFFE00n)) throw new Error(`Generated work '${bytesToHex(work)}' is invalid`);
  return work;
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
  const work = await generateProofOfWork(previousHash || publicKey);

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
 * Submits a POST request to a node
 * @param data - The form data to send
 */
function request(data: any): Promise<any> {
  // Validate API URL
  if (!API_URL) throw new Error(`API URL is invalid`);
  // Perform request
  return new Promise((resolve, reject) => {
    const body = JSON.stringify(data);
    fetch(API_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Content-Length": String(body.length)
      },
      body: body
    })
      .then(response => {
        const content = response.json();
        resolve(content);
      })
      .catch(error => {
        reject(error);
      });
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
 * Logs the response error along with the callee of this function
 * @param error - The error message to log
 */
function logResponseError(error: string): void {
  const stack = new Error("").stack.split("\n")[2].replace(/^\s+at\s+(.+?)\s.+/g, "$1");
  const callee = stack.substr(stack.lastIndexOf(".") + 1).trim();
  // eslint-disable-next-line no-console
  console.warn(`API call '${callee}' failed with: '${error}'`);
}

/**
 * Sets the API URL of the node to perform requests with
 */
export function setAPIURL(url: string): void {
  // Validate API URL
  if (url.startsWith("https") || url.startsWith("http")) {
    API_URL = url;
  } else {
    throw new Error(`Invalid API URL`);
  }
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
  if (!isValidJSONResponse(json)) {
    logResponseError(json.error);
    return null;
  }
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
  if (!isValidJSONResponse(json)) {
    logResponseError(json.error);
    return null;
  }
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
  if (!isValidJSONResponse(json)) {
    logResponseError(json.error);
    return null;
  }
  return parseAccountRepresentativeResponse(json);
}

/**
 * Returns the history of the provided account
 * @param publicKey - The public key of the account to query for
 * @param count - Optional limit of history items to query
 */
export async function getAccountHistory(publicKey: Uint8Array, count: number = -1): Promise<IAccountHistoryResponse> {
  const accountAddress = getAccountAddress(publicKey);
  const json = await request({
    action: "account_history",
    account: accountAddress,
    count: count,
    raw: false
  });
  if (!isValidJSONResponse(json)) {
    logResponseError(json.error);
    return null;
  }
  return parseAccountHistoryResponse(json);
}

/**
 * Returns the pending blocks of the provided account
 * @param publicKey - The public key of the account to query for
 * @param count - Optional limit of pending blocks to query
 */
export async function getAccountPending(publicKey: Uint8Array, count: number = -1): Promise<IAccountPendingResponse> {
  const accountAddress = getAccountAddress(publicKey);
  const json = await request({
    action: "accounts_pending",
    accounts: [accountAddress],
    count: count,
    threshold: 1,
    source: true,
  });
  if (!isValidJSONResponse(json)) {
    logResponseError(json.error);
    return null;
  }
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
  if (!isValidJSONResponse(json)) {
    logResponseError(json.error);
    return null;
  }
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
  if (!isValidJSONResponse(json)) {
    logResponseError(json.error);
    return null;
  }
  return parseBlockProcessResponse(json);
}

/**
 * Send amount to the given the account
 * @param srcPrivateKey - The private key of the sender account
 * @param dstPublicKey - The public key of the receiver account
 * @param amount - The amount to send
 */
export async function sendAccount(srcPrivateKey: Uint8Array, dstPublicKey: Uint8Array, amount: bigint): Promise<IBlockProcessResponse> {
  const srcPublicKey = getPublicKey(srcPrivateKey);
  const srcAccountInfo = await getAccountInfo(srcPublicKey);
  const srcAccountBalance = await getAccountBalance(srcPublicKey);
  const srcAccountRepresentative = await getAccountRepresentative(srcPublicKey);

  const balance = srcAccountBalance.balance - amount;
  if (srcAccountBalance.balance <= 0n || balance < 0n) return null;

  const previousHash = srcAccountInfo.frontier;
  const block = await generateProcessBlock(srcPrivateKey, previousHash, srcAccountRepresentative.account, dstPublicKey, balance);

  // Submit block to the blockchain
  const json = await request({
    "action": "process",
    "json_block": "true",
    "subtype": "send",
    "block": block,
  });
  if (!isValidJSONResponse(json)) {
    logResponseError(json.error);
    return null;
  }
  return parseBlockProcessResponse(json);
}
