/**
 * Represents a RPC account representative response
 */
export interface IAccountRepresentativeResponse {
    /**
     * The public key of the representative account
     */
    account: Uint8Array;
}
/**
 * Parses the provided json into an abstract representation
 * @param json - The json to parse
 */
export declare function parseAccountRepresentativeResponse(json: any): IAccountRepresentativeResponse;
//# sourceMappingURL=account-representative.d.ts.map