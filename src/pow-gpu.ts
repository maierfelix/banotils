import {bytesToHex, hexToBytes} from "./utils";

// @ts-ignore
import vertSource from "./pow-gpu.vert";
// @ts-ignore
import fragSource from "./pow-gpu.frag";

function arrayHex(arr: Uint8Array, length: number): string {
  let out = "";
  for (let i = length - 1; i > -1; i--) {
    out += (arr[i] > 15 ? "" : "0") + arr[i].toString(16);
  }
  return out;
}

function hexReverse(hex: string): string {
  let out = "";
  for (let i = hex.length; i > 0; i -= 2) {
    out += hex.slice(i - 2, i);
  }
  return out;
}

const canvas = document.createElement("canvas");
const gl = canvas.getContext("webgl2");

const vertexShader = gl.createShader(gl.VERTEX_SHADER);
gl.shaderSource(vertexShader, vertSource);
gl.compileShader(vertexShader);

const fragmentShader = gl.createShader(gl.FRAGMENT_SHADER);
gl.shaderSource(fragmentShader, fragSource);
gl.compileShader(fragmentShader);

const program = gl.createProgram();
gl.attachShader(program, vertexShader);
gl.attachShader(program, fragmentShader);
gl.linkProgram(program);

/**
 * Calculates the work for the provided hash
 * @param hash - The hash to generate work for
 * @param dimension - The dimension of the canvas to calculate on
 */
export function getWorkGPU(hash: Uint8Array, dimension: number = 1): Promise<Uint8Array> {
  canvas.width = canvas.height = 256 << dimension;

  const reverseHex = hexReverse(bytesToHex(hash));

  // Setup state
  gl.useProgram(program);
  gl.viewport(0, 0, gl.drawingBufferWidth, gl.drawingBufferHeight);
  gl.clearColor(0, 0, 0, 1);

  // Upload hash into uniforms
  gl.uniform4uiv(gl.getUniformLocation(program, "uHash0"), new Uint32Array([
    parseInt(reverseHex.slice(56, 64), 16),
    parseInt(reverseHex.slice(48, 56), 16),
    parseInt(reverseHex.slice(40, 48), 16),
    parseInt(reverseHex.slice(32, 40), 16)
  ]));
  gl.uniform4uiv(gl.getUniformLocation(program, "uHash1"), new Uint32Array([
    parseInt(reverseHex.slice(24, 32), 16),
    parseInt(reverseHex.slice(16, 24), 16),
    parseInt(reverseHex.slice(8, 16), 16),
    parseInt(reverseHex.slice(0, 8), 16)
  ]));

  return new Promise(resolve => {

    const work0 = new Uint8Array(4);
    const work1 = new Uint8Array(4);

    // Run until match
    requestAnimationFrame(function drawLoop() {
      crypto.getRandomValues(work0);
      crypto.getRandomValues(work1);

      // Upload work into uniforms
      gl.uniform4uiv(gl.getUniformLocation(program, "uWork0"), Array.from(work0));
      gl.uniform4uiv(gl.getUniformLocation(program, "uWork1"), Array.from(work1));

      // Calculate
      gl.clear(gl.COLOR_BUFFER_BIT);
      gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);

      // Read back result to CPU
      const pixels = new Uint8Array(gl.drawingBufferWidth * gl.drawingBufferHeight * 4);
      gl.readPixels(0, 0, gl.drawingBufferWidth, gl.drawingBufferHeight, gl.RGBA, gl.UNSIGNED_BYTE, pixels);

      // Check the pixels for any success
      for (let ii = 0; ii < pixels.length; ii += 4) {
        if (pixels[ii] !== 0) {
          const hexA = arrayHex(work1, 4);
          const hexB = arrayHex(new Uint8Array([pixels[ii + 2], pixels[ii + 3], work0[2] ^ (pixels[ii] - 1), work0[3] ^ (pixels[ii + 1] - 1)]), 4);
          const hash = hexA + hexB;
          resolve(hexToBytes(hash));
          // Break loop
          return;
        }
      }

      requestAnimationFrame(drawLoop);
    });

  });
}
