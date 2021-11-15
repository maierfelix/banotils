import {hexToBytes} from "../utils";

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
export function parseAccountInfoResponse(json: any): IAccountInfoResponse {
  try {
    const output: IAccountInfoResponse = {
      blockCount: parseInt(json.block_count),
      frontier: hexToBytes(json.frontier),
      representativeBlock: hexToBytes(json.representative_block),
      modificationTimestamp: parseInt(json.modified_timestamp),
    };
    return output;
  } catch (e) { }
  return null;
}
