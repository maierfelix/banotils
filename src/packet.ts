import {clamp, bitsToByte, byteToBits, bitsNToBits, bitsToBitsN} from "./utils";

/**
 * Represents packet layout member
 */
export interface IPacketLayoutMember {
  id: number;
  bitLength: number;
}

/**
 * Packet layout alias
 */
export type IPacketLayout = IPacketLayoutMember[];

/**
 * RAW packet data alias
 */
export type PacketData = number[];

/**
 * The bits to encode per digit
 */
export const PACKET_BIT_STRIDE = 3;

/**
 * Returns the total bit length of the provided layout
 * @param layout - The layout to process
 */
export function getLayoutBitLength(layout: IPacketLayout): number {
  let length = 0;
  for (const member of layout) {
    length += member.bitLength;
  }
  return length;
}

/**
 * Class representing a packet layout
 */
export class PacketLayout {

  /**
   * Packet layout of the class
   */
  private _layout: IPacketLayout = null;

  /**
   * Packet layout of the class
   */
  private _layoutBitOffsetTable: Uint8Array = null;

  /**
   * The total bit length of the packet layout
   */
  private _totalBitLength: number = 0;

  /**
   * The constructor of this packet layout
   * @param layout - The packet layout to use
   */
  public constructor(layout: IPacketLayout) {
    this._layout = layout;
    this._totalBitLength = getLayoutBitLength(layout);
    this._layoutBitOffsetTable = this._createLayoutBitOffsetTable();
  }

  /**
   * Returns the layout
   */
  public getLayout(): IPacketLayout {return this._layout;}

  /**
   * Returns the layout bit offset table
   */
  public getLayoutBitOffsetTable(): Uint8Array {return this._layoutBitOffsetTable;}

  /**
   * Returns the total bit length of the packet layout
   */
  public getTotalBitLength(): number {return this._totalBitLength;}

  /**
   * Encodes the provided packet data
   * @param packet - The packet to encode
   */
  public encode(packet: PacketData): Uint8Array {
    const layout = this.getLayout();
    const output = new Uint8Array(this.getTotalBitLength());

    let bitOffset = 0;
    // Encode packet members
    for (let ii = 0; ii < layout.length; ++ii) {
      const data = packet[ii];
      const {bitLength} = layout[ii];
      const bitRange = ((1 << bitLength) - 1);
      if (data < 0 || data > bitRange) {
        throw new Error(`Layout member data '${data}' exceeds bit range '${bitRange + 1}'`);
      }
      const dataBits = byteToBits(data, bitLength).reverse();
      output.set(dataBits, bitOffset);
      bitOffset += bitLength;
    }

    return bitsToBitsN(output, PACKET_BIT_STRIDE);
  }

  /**
   * Decodes the packet member of the provided packet data
   * @param memberId - The member id to query by
   * @param bits - The packet bits to decode
   */
  public decode(memberId: number, bits: Uint8Array): number {
    const {id, bitLength} = this.getLayout()[memberId];
    const bitOffset = this.getLayoutBitOffsetTable()[id];
    // Decode packet member
    const byte = bitsToByte(bits.subarray(bitOffset, bitOffset + bitLength), bitLength);
    const bitRange = ((1 << bitLength) - 1);
    // Extra safety here, make sure that the data never goes out of range
    const output = clamp(byte & bitRange, 0, bitRange);
    return output;
  }

  /**
   * Create a bit offset table to accelerate layout access times
   */
  private _createLayoutBitOffsetTable(): Uint8Array {
    const layout = this.getLayout();
    const table = new Uint8Array(layout.length);
    let bitOffset = 0;
    for (let ii = 0; ii < layout.length; ++ii) {
      const {id, bitLength} = layout[ii];
      table[id] = bitOffset;
      bitOffset += bitLength;
    }
    return table;
  }

  /**
   * Returns a bit representation of the provided data
   * @param data - The packet data to decode into bits
   */
  public static getPacketBits(data: Uint8Array): Uint8Array {
    const bits = bitsNToBits(data, PACKET_BIT_STRIDE);
    return bits;
  }

  /**
   * Decodes the packet id of the provided packet data
   * @param bits - The packet bits to decode
   * @param min - The minimum value of the packet id
   * @param max - The maximum value of the packet id
   */
  public static decodeId(bits: Uint8Array, min: number, max: number): number {
    const bitOffset = 0;
    const bitLength = 4;
    const byte = bitsToByte(bits.subarray(bitOffset, bitOffset + bitLength), bitLength);
    const bitRange = ((1 << bitLength) - 1);
    // Make sure the packet id never goes out of id range
    const id = clamp(byte & bitRange, 0, bitRange);
    return clamp(id, min, max);
  }

}
