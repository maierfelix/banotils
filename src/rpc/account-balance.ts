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
export function parseAccountBalanceResponse(json: any): IAccountBalanceResponse {
  try {
    const balance = Object.values(json.balances)[0] as any;
    const output: IAccountBalanceResponse = {
      balance: BigInt(balance.balance),
      pending: BigInt(balance.pending),
    };
    return output;
  } catch (e) { }
  return null;
}
