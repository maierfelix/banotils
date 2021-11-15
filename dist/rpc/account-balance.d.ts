/**
 * Represents a RPC account balance response
 */
export interface IAccountBalanceResponse {
    /**
     * The current balance of the account
     */
    balance: bigint;
    /**
     * The currently pending balanace of the account
     */
    pending: bigint;
}
/**
 * Parses the provided json into an abstract representation
 * @param json - The json to parse
 */
export declare function parseAccountBalanceResponse(json: any): IAccountBalanceResponse;
//# sourceMappingURL=account-balance.d.ts.map