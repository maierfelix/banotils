import {derivePublicKeyFromAddress} from "../crypto";

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
export function parseAccountRepresentativeResponse(json: any): IAccountRepresentativeResponse {
  try {
    const output: IAccountRepresentativeResponse = {
      account: derivePublicKeyFromAddress(json.representative)
    };
    return output;
  } catch (e) { }
  return null;
}
