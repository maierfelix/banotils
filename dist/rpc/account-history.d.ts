/**
 * Represents an account history item action
 */
export declare enum ACCOUNT_HISTORY_ITEM_ACTION {
    /**
     * History item send action
     */
    SEND = 0,
    /**
     * History item receive action
     */
    RECEIVE = 1
}
/**
 * Represents an account history item
 */
export interface IAccountHistoryItem {
    /**
     * The hash of the history item
     */
    hash: Uint8Array;
    /**
     * The amount that got sent/received
     */
    amount: bigint;
    /**
     * The account that sent or received the amount
     */
    account: Uint8Array;
    /**
     * The action that was performed
     */
    action: ACCOUNT_HISTORY_ITEM_ACTION;
}
/**
 * Represents a RPC account history response
 */
export interface IAccountHistoryResponse {
    history: IAccountHistoryItem[];
}
/**
 * Parses the provided json into an abstract representation
 * @param json - The json to parse
 */
export declare function parseAccountHistoryResponse(json: any): IAccountHistoryResponse;
//# sourceMappingURL=account-history.d.ts.map