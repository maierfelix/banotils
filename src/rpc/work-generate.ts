import {hexToBytes} from "../utils";

/**
 * Represents a RPC work generate response
 */
export interface IWorkGenerateResponse {
  /**
   * The work that was generated
   */
  work: Uint8Array;
}

/**
 * Parses the provided json into an abstract representation
 * @param json - The json to parse
 */
export function parseWorkGenerateResponse(json: any): IWorkGenerateResponse {
  try {
    const output: IWorkGenerateResponse = {
      work: hexToBytes(json.work),
    };
    return output;
  } catch (e) { }
  return null;
}
