/**
 * Represents a pending account item
 */
export interface IAccountPendingItem {
    /**
     * The pending amount
     */
    amount: bigint;
    /**
     * The hash of the pending block
     */
    hash: Uint8Array;
    /**
     * The public key of the source account that submitted the pending block
     */
    source: Uint8Array;
}
/**
 * Represents a RPC account pending response
 */
export interface IAccountPendingResponse {
    /**
     * List of pending blocks
     */
    blocks: IAccountPendingItem[];
}
/**
 * Parses the provided json into an abstract representation
 * @param json - The json to parse
 */
export declare function parseAccountPendingResponse(json: any): IAccountPendingResponse;
//# sourceMappingURL=account-pending.d.ts.map