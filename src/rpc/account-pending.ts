import {hexToBytes} from "../utils";
import {derivePublicKeyFromAddress} from "../crypto";

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
export function parseAccountPendingResponse(json: any): IAccountPendingResponse {
  try {
    const output: IAccountPendingResponse = {
      blocks: []
    };
    const blocks = Object.values(json.blocks)[0] as any;
    for (const [key, value] of Object.entries(blocks)) {
      const {amount, source} = value as any;
      const item: IAccountPendingItem = {
        amount: BigInt(amount),
        hash: hexToBytes(key),
        source: derivePublicKeyFromAddress(source)
      };
      output.blocks.push(item);
    }
    return output;
  } catch (e) { }
  return null;
}
