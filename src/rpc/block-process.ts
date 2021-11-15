import {hexToBytes} from "../utils";

/**
 * Represents a RPC block process response
 */
export interface IBlockProcessResponse {
  /**
   * The hash of the processed block
   */
  hash: Uint8Array;
}

/**
 * Parses the provided json into an abstract representation
 * @param json - The json to parse
 */
export function parseBlockProcessResponse(json: any): IBlockProcessResponse {
  try {
    const output: IBlockProcessResponse = {
      hash: hexToBytes(json.hash)
    };
    return output;
  } catch (e) { }
  return null;
}
