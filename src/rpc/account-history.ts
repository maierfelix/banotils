import {hexToBytes} from "../utils";
import {derivePublicKeyFromAddress} from "../crypto";

/**
 * Represents an account history item action
 */
export enum ACCOUNT_HISTORY_ITEM_ACTION {
  /**
   * History item send action
   */
  SEND,
  /**
   * History item receive action
   */
  RECEIVE,
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
export function parseAccountHistoryResponse(json: any): IAccountHistoryResponse {
  try {
    if (Array.isArray(json.history)) {
      const output: IAccountHistoryResponse = {
        history: []
      };
      for (const history of json.history) {
        output.history.push({
          hash: hexToBytes(history.hash),
          amount: BigInt(history.amount),
          account: derivePublicKeyFromAddress(history.account),
          action: history.type === "send" ? ACCOUNT_HISTORY_ITEM_ACTION.SEND : ACCOUNT_HISTORY_ITEM_ACTION.RECEIVE,
        });
      }
      return output;
    }
  } catch (e) { }
  return null;
}
