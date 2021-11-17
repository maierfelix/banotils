import * as qrcode from "minimal-qr-code";

/**
 * Returns a QR code representation of the provided account address
 * @param address - The account address to generate the QR code for
 */
export function generateAccountAddressQRCode(address: string): HTMLCanvasElement {
  const qr = qrcode.makeQR(address, 5, 0);
  const canvas = document.createElement("canvas");
  const ctx = canvas.getContext("2d");
  canvas.width = qr.size;
  canvas.height = qr.size;
  for (let yy = 0; yy < qr.size; ++yy) {
    for (let xx = 0; xx < qr.size; ++xx) {
      const color = qr.isDark(xx, yy) ? `rgb(0, 0, 0)` : `rgb(255, 255, 255)`;
      ctx.fillStyle = color;
      ctx.fillRect(xx, yy, 1, 1);
    }
  }
  return canvas;
}
