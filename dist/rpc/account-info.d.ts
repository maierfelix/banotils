/**
 * Represents a RPC account info response
 */
export interface IAccountInfoResponse {
    /**
     * The amount of blocks that the account processed
     */
    blockCount: number;
    /**
     * The latest block of the account
     */
    frontier: Uint8Array;
    /**
     * Block of the linked representative
     */
    representativeBlock: Uint8Array;
    /**
     * Timestamp indicating the last modification to the account
     */
    modificationTimestamp: number;
}
/**
 * Parses the provided json into an abstract representation
 * @param json - The json to parse
 */
export declare function parseAccountInfoResponse(json: any): IAccountInfoResponse;
//# sourceMappingURL=account-info.d.ts.map