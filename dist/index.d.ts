import { IAccountBalanceResponse } from "./rpc/account-balance";
import { IAccountHistoryResponse } from "./rpc/account-history";
import { IAccountInfoResponse } from "./rpc/account-info";
import { IAccountPendingResponse } from "./rpc/account-pending";
import { IAccountRepresentativeResponse } from "./rpc/account-representative";
import { IBlockProcessResponse } from "./rpc/block-process";
export * from "./utils";
export * from "./pow-gpu";
export * from "./qr-code";
export * from "./mnemonic";
/**
 * Sets the API URL of the node to perform requests with
 */
export declare function setAPIURL(url: string): void;
/**
 * Returns the info of the provided account
 * @param publicKey - The public key of the account to query for
 */
export declare function getAccountInfo(publicKey: Uint8Array): Promise<IAccountInfoResponse>;
/**
 * Returns the balance of the provided account
 * @param publicKey - The public key of the account to query for
 */
export declare function getAccountBalance(publicKey: Uint8Array): Promise<IAccountBalanceResponse>;
/**
 * Returns the representative of the provided account
 * @param publicKey - The public key of the account to query for
 */
export declare function getAccountRepresentative(publicKey: Uint8Array): Promise<IAccountRepresentativeResponse>;
/**
 * Returns the history of the provided account
 * @param publicKey - The public key of the account to query for
 * @param count - Optional limit of history items to query
 */
export declare function getAccountHistory(publicKey: Uint8Array, count?: number): Promise<IAccountHistoryResponse>;
/**
 * Returns the pending blocks of the provided account
 * @param publicKey - The public key of the account to query for
 * @param count - Optional limit of pending blocks to query
 */
export declare function getAccountPending(publicKey: Uint8Array, count?: number): Promise<IAccountPendingResponse>;
/**
 * Open an account that is currently unopened
 * @param privateKey - The private key of the account
 * @param representative - The representative to link to the account
 * @param pendingHash - The pending hash to open with
 * @param pendingAmount - The pending amount to open with
 */
export declare function openAccount(privateKey: Uint8Array, representative: Uint8Array, pendingHash: Uint8Array, pendingAmount: bigint): Promise<IBlockProcessResponse>;
/**
 * Receive a pending deposit for the given account
 * @param privateKey - The private key of the account
 * @param representative - The representative to link to the account
 * @param pendingHash - The pending hash to receive
 * @param pendingAmount - The pending amount to receive
 */
export declare function receiveAccount(privateKey: Uint8Array, representative: Uint8Array, pendingHash: Uint8Array, pendingAmount: bigint): Promise<IBlockProcessResponse>;
/**
 * Send amount to the given the account
 * @param srcPrivateKey - The private key of the sender account
 * @param dstPublicKey - The public key of the receiver account
 * @param amount - The amount to send
 */
export declare function sendAccount(srcPrivateKey: Uint8Array, dstPublicKey: Uint8Array, amount: bigint): Promise<IBlockProcessResponse>;
//# sourceMappingURL=index.d.ts.map