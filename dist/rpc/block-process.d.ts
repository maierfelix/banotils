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
export declare function parseBlockProcessResponse(json: any): IBlockProcessResponse;
//# sourceMappingURL=block-process.d.ts.map