import * as qrcode from "minimal-qr-code";

/**
 * Represents QR code data
 */
export interface IQRCodeData {
  data: Uint8ClampedArray;
  size: number;
}

/**
 * Returns a QR code representation of the provided text
 * @param text - The text to generate the QR code for
 * @param typeNumber - Optional type number
 */
export function generateQRCodeData(text: string, typeNumber: number = 5): IQRCodeData {
  const qr = qrcode.makeQR(text, typeNumber, 0);
  const data = new Uint8ClampedArray(4 * qr.size * qr.size);
  for (let yy = 0; yy < qr.size; ++yy) {
    for (let xx = 0; xx < qr.size; ++xx) {
      const index = (qr.size * yy) + xx;
      const color = qr.isDark(xx, yy) ? 0 : 255;
      data[(index * 4) + 0] = color;
      data[(index * 4) + 1] = color;
      data[(index * 4) + 2] = color;
      data[(index * 4) + 3] = 255;
    }
  }
  return {data, size: qr.size};
}
