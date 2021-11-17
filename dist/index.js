'use strict';

Object.defineProperty(exports, '__esModule', { value: true });

require('crypto');

const ERROR_MSG_INPUT = 'Input must be an string, Buffer or Uint8Array';

// For convenience, let people hash a string, not just a Uint8Array
function normalizeInput (input) {
  let ret;
  if (input instanceof Uint8Array) {
    ret = input;
  } else {
    throw new Error(ERROR_MSG_INPUT)
  }
  return ret
}

// Converts a Uint8Array to a hexadecimal string
// For example, toHex([255, 0, 255]) returns "ff00ff"
function toHex (bytes) {
  return Array.prototype.map
    .call(bytes, function (n) {
      return (n < 16 ? '0' : '') + n.toString(16)
    })
    .join('')
}

// Converts any value in [0...2^32-1] to an 8-character hex string
function uint32ToHex (val) {
  return (0x100000000 + val).toString(16).substring(1)
}

// For debugging: prints out hash state in the same format as the RFC
// sample computation exactly, so that you can diff
function debugPrint (label, arr, size) {
  let msg = '\n' + label + ' = ';
  for (let i = 0; i < arr.length; i += 2) {
    if (size === 32) {
      msg += uint32ToHex(arr[i]).toUpperCase();
      msg += ' ';
      msg += uint32ToHex(arr[i + 1]).toUpperCase();
    } else if (size === 64) {
      msg += uint32ToHex(arr[i + 1]).toUpperCase();
      msg += uint32ToHex(arr[i]).toUpperCase();
    } else throw new Error('Invalid size ' + size)
    if (i % 6 === 4) {
      msg += '\n' + new Array(label.length + 4).join(' ');
    } else if (i < arr.length - 2) {
      msg += ' ';
    }
  }
  console.log(msg);
}

// For performance testing: generates N bytes of input, hashes M times
// Measures and prints MB/second hash performance each time
function testSpeed (hashFn, N, M) {
  let startMs = new Date().getTime();

  const input = new Uint8Array(N);
  for (let i = 0; i < N; i++) {
    input[i] = i % 256;
  }
  const genMs = new Date().getTime();
  console.log('Generated random input in ' + (genMs - startMs) + 'ms');
  startMs = genMs;

  for (let i = 0; i < M; i++) {
    const hashHex = hashFn(input);
    const hashMs = new Date().getTime();
    const ms = hashMs - startMs;
    startMs = hashMs;
    console.log('Hashed in ' + ms + 'ms: ' + hashHex.substring(0, 20) + '...');
    console.log(
      Math.round((N / (1 << 20) / (ms / 1000)) * 100) / 100 + ' MB PER SECOND'
    );
  }
}

var util$2 = {
  normalizeInput: normalizeInput,
  toHex: toHex,
  debugPrint: debugPrint,
  testSpeed: testSpeed
};

// Blake2B in pure Javascript
// Adapted from the reference implementation in RFC7693
// Ported to Javascript by DC - https://github.com/dcposch

const util$1 = util$2;

// 64-bit unsigned addition
// Sets v[a,a+1] += v[b,b+1]
// v should be a Uint32Array
function ADD64AA (v, a, b) {
  const o0 = v[a] + v[b];
  let o1 = v[a + 1] + v[b + 1];
  if (o0 >= 0x100000000) {
    o1++;
  }
  v[a] = o0;
  v[a + 1] = o1;
}

// 64-bit unsigned addition
// Sets v[a,a+1] += b
// b0 is the low 32 bits of b, b1 represents the high 32 bits
function ADD64AC (v, a, b0, b1) {
  let o0 = v[a] + b0;
  if (b0 < 0) {
    o0 += 0x100000000;
  }
  let o1 = v[a + 1] + b1;
  if (o0 >= 0x100000000) {
    o1++;
  }
  v[a] = o0;
  v[a + 1] = o1;
}

// Little-endian byte access
function B2B_GET32 (arr, i) {
  return arr[i] ^ (arr[i + 1] << 8) ^ (arr[i + 2] << 16) ^ (arr[i + 3] << 24)
}

// G Mixing function
// The ROTRs are inlined for speed
function B2B_G (a, b, c, d, ix, iy) {
  const x0 = m$1[ix];
  const x1 = m$1[ix + 1];
  const y0 = m$1[iy];
  const y1 = m$1[iy + 1];

  ADD64AA(v$1, a, b); // v[a,a+1] += v[b,b+1] ... in JS we must store a uint64 as two uint32s
  ADD64AC(v$1, a, x0, x1); // v[a, a+1] += x ... x0 is the low 32 bits of x, x1 is the high 32 bits

  // v[d,d+1] = (v[d,d+1] xor v[a,a+1]) rotated to the right by 32 bits
  let xor0 = v$1[d] ^ v$1[a];
  let xor1 = v$1[d + 1] ^ v$1[a + 1];
  v$1[d] = xor1;
  v$1[d + 1] = xor0;

  ADD64AA(v$1, c, d);

  // v[b,b+1] = (v[b,b+1] xor v[c,c+1]) rotated right by 24 bits
  xor0 = v$1[b] ^ v$1[c];
  xor1 = v$1[b + 1] ^ v$1[c + 1];
  v$1[b] = (xor0 >>> 24) ^ (xor1 << 8);
  v$1[b + 1] = (xor1 >>> 24) ^ (xor0 << 8);

  ADD64AA(v$1, a, b);
  ADD64AC(v$1, a, y0, y1);

  // v[d,d+1] = (v[d,d+1] xor v[a,a+1]) rotated right by 16 bits
  xor0 = v$1[d] ^ v$1[a];
  xor1 = v$1[d + 1] ^ v$1[a + 1];
  v$1[d] = (xor0 >>> 16) ^ (xor1 << 16);
  v$1[d + 1] = (xor1 >>> 16) ^ (xor0 << 16);

  ADD64AA(v$1, c, d);

  // v[b,b+1] = (v[b,b+1] xor v[c,c+1]) rotated right by 63 bits
  xor0 = v$1[b] ^ v$1[c];
  xor1 = v$1[b + 1] ^ v$1[c + 1];
  v$1[b] = (xor1 >>> 31) ^ (xor0 << 1);
  v$1[b + 1] = (xor0 >>> 31) ^ (xor1 << 1);
}

// Initialization Vector
const BLAKE2B_IV32 = new Uint32Array([
  0xf3bcc908,
  0x6a09e667,
  0x84caa73b,
  0xbb67ae85,
  0xfe94f82b,
  0x3c6ef372,
  0x5f1d36f1,
  0xa54ff53a,
  0xade682d1,
  0x510e527f,
  0x2b3e6c1f,
  0x9b05688c,
  0xfb41bd6b,
  0x1f83d9ab,
  0x137e2179,
  0x5be0cd19
]);

const SIGMA8 = [
  0,
  1,
  2,
  3,
  4,
  5,
  6,
  7,
  8,
  9,
  10,
  11,
  12,
  13,
  14,
  15,
  14,
  10,
  4,
  8,
  9,
  15,
  13,
  6,
  1,
  12,
  0,
  2,
  11,
  7,
  5,
  3,
  11,
  8,
  12,
  0,
  5,
  2,
  15,
  13,
  10,
  14,
  3,
  6,
  7,
  1,
  9,
  4,
  7,
  9,
  3,
  1,
  13,
  12,
  11,
  14,
  2,
  6,
  5,
  10,
  4,
  0,
  15,
  8,
  9,
  0,
  5,
  7,
  2,
  4,
  10,
  15,
  14,
  1,
  11,
  12,
  6,
  8,
  3,
  13,
  2,
  12,
  6,
  10,
  0,
  11,
  8,
  3,
  4,
  13,
  7,
  5,
  15,
  14,
  1,
  9,
  12,
  5,
  1,
  15,
  14,
  13,
  4,
  10,
  0,
  7,
  6,
  3,
  9,
  2,
  8,
  11,
  13,
  11,
  7,
  14,
  12,
  1,
  3,
  9,
  5,
  0,
  15,
  4,
  8,
  6,
  2,
  10,
  6,
  15,
  14,
  9,
  11,
  3,
  0,
  8,
  12,
  2,
  13,
  7,
  1,
  4,
  10,
  5,
  10,
  2,
  8,
  4,
  7,
  6,
  1,
  5,
  15,
  11,
  9,
  14,
  3,
  12,
  13,
  0,
  0,
  1,
  2,
  3,
  4,
  5,
  6,
  7,
  8,
  9,
  10,
  11,
  12,
  13,
  14,
  15,
  14,
  10,
  4,
  8,
  9,
  15,
  13,
  6,
  1,
  12,
  0,
  2,
  11,
  7,
  5,
  3
];

// These are offsets into a uint64 buffer.
// Multiply them all by 2 to make them offsets into a uint32 buffer,
// because this is Javascript and we don't have uint64s
const SIGMA82 = new Uint8Array(
  SIGMA8.map(function (x) {
    return x * 2
  })
);

// Compression function. 'last' flag indicates last block.
// Note we're representing 16 uint64s as 32 uint32s
const v$1 = new Uint32Array(32);
const m$1 = new Uint32Array(32);
function blake2bCompress (ctx, last) {
  let i = 0;

  // init work variables
  for (i = 0; i < 16; i++) {
    v$1[i] = ctx.h[i];
    v$1[i + 16] = BLAKE2B_IV32[i];
  }

  // low 64 bits of offset
  v$1[24] = v$1[24] ^ ctx.t;
  v$1[25] = v$1[25] ^ (ctx.t / 0x100000000);
  // high 64 bits not supported, offset may not be higher than 2**53-1

  // last block flag set ?
  if (last) {
    v$1[28] = ~v$1[28];
    v$1[29] = ~v$1[29];
  }

  // get little-endian words
  for (i = 0; i < 32; i++) {
    m$1[i] = B2B_GET32(ctx.b, 4 * i);
  }

  // twelve rounds of mixing
  // uncomment the DebugPrint calls to log the computation
  // and match the RFC sample documentation
  // util.debugPrint('          m[16]', m, 64)
  for (i = 0; i < 12; i++) {
    // util.debugPrint('   (i=' + (i < 10 ? ' ' : '') + i + ') v[16]', v, 64)
    B2B_G(0, 8, 16, 24, SIGMA82[i * 16 + 0], SIGMA82[i * 16 + 1]);
    B2B_G(2, 10, 18, 26, SIGMA82[i * 16 + 2], SIGMA82[i * 16 + 3]);
    B2B_G(4, 12, 20, 28, SIGMA82[i * 16 + 4], SIGMA82[i * 16 + 5]);
    B2B_G(6, 14, 22, 30, SIGMA82[i * 16 + 6], SIGMA82[i * 16 + 7]);
    B2B_G(0, 10, 20, 30, SIGMA82[i * 16 + 8], SIGMA82[i * 16 + 9]);
    B2B_G(2, 12, 22, 24, SIGMA82[i * 16 + 10], SIGMA82[i * 16 + 11]);
    B2B_G(4, 14, 16, 26, SIGMA82[i * 16 + 12], SIGMA82[i * 16 + 13]);
    B2B_G(6, 8, 18, 28, SIGMA82[i * 16 + 14], SIGMA82[i * 16 + 15]);
  }
  // util.debugPrint('   (i=12) v[16]', v, 64)

  for (i = 0; i < 16; i++) {
    ctx.h[i] = ctx.h[i] ^ v$1[i] ^ v$1[i + 16];
  }
  // util.debugPrint('h[8]', ctx.h, 64)
}

// Creates a BLAKE2b hashing context
// Requires an output length between 1 and 64 bytes
// Takes an optional Uint8Array key
function blake2bInit (outlen, key) {
  if (outlen === 0 || outlen > 64) {
    throw new Error('Illegal output length, expected 0 < length <= 64')
  }
  if (key && key.length > 64) {
    throw new Error('Illegal key, expected Uint8Array with 0 < length <= 64')
  }

  // state, 'param block'
  const ctx = {
    b: new Uint8Array(128),
    h: new Uint32Array(16),
    t: 0, // input count
    c: 0, // pointer within buffer
    outlen: outlen // output length in bytes
  };

  // initialize hash state
  for (let i = 0; i < 16; i++) {
    ctx.h[i] = BLAKE2B_IV32[i];
  }
  const keylen = key ? key.length : 0;
  ctx.h[0] ^= 0x01010000 ^ (keylen << 8) ^ outlen;

  // key the hash, if applicable
  if (key) {
    blake2bUpdate(ctx, key);
    // at the end
    ctx.c = 128;
  }

  return ctx
}

// Updates a BLAKE2b streaming hash
// Requires hash context and Uint8Array (byte array)
function blake2bUpdate (ctx, input) {
  for (let i = 0; i < input.length; i++) {
    if (ctx.c === 128) {
      // buffer full ?
      ctx.t += ctx.c; // add counters
      blake2bCompress(ctx, false); // compress (not last)
      ctx.c = 0; // counter to zero
    }
    ctx.b[ctx.c++] = input[i];
  }
}

// Completes a BLAKE2b streaming hash
// Returns a Uint8Array containing the message digest
function blake2bFinal (ctx) {
  ctx.t += ctx.c; // mark last block offset

  while (ctx.c < 128) {
    // fill up with zeros
    ctx.b[ctx.c++] = 0;
  }
  blake2bCompress(ctx, true); // final block flag = 1

  // little endian convert and store
  const out = new Uint8Array(ctx.outlen);
  for (let i = 0; i < ctx.outlen; i++) {
    out[i] = ctx.h[i >> 2] >> (8 * (i & 3));
  }
  return out
}

// Computes the BLAKE2B hash of a string or byte array, and returns a Uint8Array
//
// Returns a n-byte Uint8Array
//
// Parameters:
// - input - the input bytes, as a string, Buffer or Uint8Array
// - key - optional key Uint8Array, up to 64 bytes
// - outlen - optional output length in bytes, default 64
function blake2b (input, key, outlen) {
  // preprocess inputs
  outlen = outlen || 64;
  input = util$1.normalizeInput(input);

  // do the math
  const ctx = blake2bInit(outlen, key);
  blake2bUpdate(ctx, input);
  return blake2bFinal(ctx)
}

// Computes the BLAKE2B hash of a string or byte array
//
// Returns an n-byte hash in hex, all lowercase
//
// Parameters:
// - input - the input bytes, as a string, Buffer, or Uint8Array
// - key - optional key Uint8Array, up to 64 bytes
// - outlen - optional output length in bytes, default 64
function blake2bHex (input, key, outlen) {
  const output = blake2b(input, key, outlen);
  return util$1.toHex(output)
}

var blake2b_1 = {
  blake2b: blake2b,
  blake2bHex: blake2bHex,
  blake2bInit: blake2bInit,
  blake2bUpdate: blake2bUpdate,
  blake2bFinal: blake2bFinal
};

// BLAKE2s hash function in pure Javascript
// Adapted from the reference implementation in RFC7693
// Ported to Javascript by DC - https://github.com/dcposch

const util = util$2;

// Little-endian byte access.
// Expects a Uint8Array and an index
// Returns the little-endian uint32 at v[i..i+3]
function B2S_GET32 (v, i) {
  return v[i] ^ (v[i + 1] << 8) ^ (v[i + 2] << 16) ^ (v[i + 3] << 24)
}

// Mixing function G.
function B2S_G (a, b, c, d, x, y) {
  v[a] = v[a] + v[b] + x;
  v[d] = ROTR32(v[d] ^ v[a], 16);
  v[c] = v[c] + v[d];
  v[b] = ROTR32(v[b] ^ v[c], 12);
  v[a] = v[a] + v[b] + y;
  v[d] = ROTR32(v[d] ^ v[a], 8);
  v[c] = v[c] + v[d];
  v[b] = ROTR32(v[b] ^ v[c], 7);
}

// 32-bit right rotation
// x should be a uint32
// y must be between 1 and 31, inclusive
function ROTR32 (x, y) {
  return (x >>> y) ^ (x << (32 - y))
}

// Initialization Vector.
const BLAKE2S_IV = new Uint32Array([
  0x6a09e667,
  0xbb67ae85,
  0x3c6ef372,
  0xa54ff53a,
  0x510e527f,
  0x9b05688c,
  0x1f83d9ab,
  0x5be0cd19
]);

const SIGMA = new Uint8Array([
  0,
  1,
  2,
  3,
  4,
  5,
  6,
  7,
  8,
  9,
  10,
  11,
  12,
  13,
  14,
  15,
  14,
  10,
  4,
  8,
  9,
  15,
  13,
  6,
  1,
  12,
  0,
  2,
  11,
  7,
  5,
  3,
  11,
  8,
  12,
  0,
  5,
  2,
  15,
  13,
  10,
  14,
  3,
  6,
  7,
  1,
  9,
  4,
  7,
  9,
  3,
  1,
  13,
  12,
  11,
  14,
  2,
  6,
  5,
  10,
  4,
  0,
  15,
  8,
  9,
  0,
  5,
  7,
  2,
  4,
  10,
  15,
  14,
  1,
  11,
  12,
  6,
  8,
  3,
  13,
  2,
  12,
  6,
  10,
  0,
  11,
  8,
  3,
  4,
  13,
  7,
  5,
  15,
  14,
  1,
  9,
  12,
  5,
  1,
  15,
  14,
  13,
  4,
  10,
  0,
  7,
  6,
  3,
  9,
  2,
  8,
  11,
  13,
  11,
  7,
  14,
  12,
  1,
  3,
  9,
  5,
  0,
  15,
  4,
  8,
  6,
  2,
  10,
  6,
  15,
  14,
  9,
  11,
  3,
  0,
  8,
  12,
  2,
  13,
  7,
  1,
  4,
  10,
  5,
  10,
  2,
  8,
  4,
  7,
  6,
  1,
  5,
  15,
  11,
  9,
  14,
  3,
  12,
  13,
  0
]);

// Compression function. "last" flag indicates last block
const v = new Uint32Array(16);
const m = new Uint32Array(16);
function blake2sCompress (ctx, last) {
  let i = 0;
  for (i = 0; i < 8; i++) {
    // init work variables
    v[i] = ctx.h[i];
    v[i + 8] = BLAKE2S_IV[i];
  }

  v[12] ^= ctx.t; // low 32 bits of offset
  v[13] ^= ctx.t / 0x100000000; // high 32 bits
  if (last) {
    // last block flag set ?
    v[14] = ~v[14];
  }

  for (i = 0; i < 16; i++) {
    // get little-endian words
    m[i] = B2S_GET32(ctx.b, 4 * i);
  }

  // ten rounds of mixing
  // uncomment the DebugPrint calls to log the computation
  // and match the RFC sample documentation
  // util.debugPrint('          m[16]', m, 32)
  for (i = 0; i < 10; i++) {
    // util.debugPrint('   (i=' + i + ')  v[16]', v, 32)
    B2S_G(0, 4, 8, 12, m[SIGMA[i * 16 + 0]], m[SIGMA[i * 16 + 1]]);
    B2S_G(1, 5, 9, 13, m[SIGMA[i * 16 + 2]], m[SIGMA[i * 16 + 3]]);
    B2S_G(2, 6, 10, 14, m[SIGMA[i * 16 + 4]], m[SIGMA[i * 16 + 5]]);
    B2S_G(3, 7, 11, 15, m[SIGMA[i * 16 + 6]], m[SIGMA[i * 16 + 7]]);
    B2S_G(0, 5, 10, 15, m[SIGMA[i * 16 + 8]], m[SIGMA[i * 16 + 9]]);
    B2S_G(1, 6, 11, 12, m[SIGMA[i * 16 + 10]], m[SIGMA[i * 16 + 11]]);
    B2S_G(2, 7, 8, 13, m[SIGMA[i * 16 + 12]], m[SIGMA[i * 16 + 13]]);
    B2S_G(3, 4, 9, 14, m[SIGMA[i * 16 + 14]], m[SIGMA[i * 16 + 15]]);
  }
  // util.debugPrint('   (i=10) v[16]', v, 32)

  for (i = 0; i < 8; i++) {
    ctx.h[i] ^= v[i] ^ v[i + 8];
  }
  // util.debugPrint('h[8]', ctx.h, 32)
}

// Creates a BLAKE2s hashing context
// Requires an output length between 1 and 32 bytes
// Takes an optional Uint8Array key
function blake2sInit (outlen, key) {
  if (!(outlen > 0 && outlen <= 32)) {
    throw new Error('Incorrect output length, should be in [1, 32]')
  }
  const keylen = key ? key.length : 0;
  if (key && !(keylen > 0 && keylen <= 32)) {
    throw new Error('Incorrect key length, should be in [1, 32]')
  }

  const ctx = {
    h: new Uint32Array(BLAKE2S_IV), // hash state
    b: new Uint8Array(64), // input block
    c: 0, // pointer within block
    t: 0, // input count
    outlen: outlen // output length in bytes
  };
  ctx.h[0] ^= 0x01010000 ^ (keylen << 8) ^ outlen;

  if (keylen > 0) {
    blake2sUpdate(ctx, key);
    ctx.c = 64; // at the end
  }

  return ctx
}

// Updates a BLAKE2s streaming hash
// Requires hash context and Uint8Array (byte array)
function blake2sUpdate (ctx, input) {
  for (let i = 0; i < input.length; i++) {
    if (ctx.c === 64) {
      // buffer full ?
      ctx.t += ctx.c; // add counters
      blake2sCompress(ctx, false); // compress (not last)
      ctx.c = 0; // counter to zero
    }
    ctx.b[ctx.c++] = input[i];
  }
}

// Completes a BLAKE2s streaming hash
// Returns a Uint8Array containing the message digest
function blake2sFinal (ctx) {
  ctx.t += ctx.c; // mark last block offset
  while (ctx.c < 64) {
    // fill up with zeros
    ctx.b[ctx.c++] = 0;
  }
  blake2sCompress(ctx, true); // final block flag = 1

  // little endian convert and store
  const out = new Uint8Array(ctx.outlen);
  for (let i = 0; i < ctx.outlen; i++) {
    out[i] = (ctx.h[i >> 2] >> (8 * (i & 3))) & 0xff;
  }
  return out
}

// Computes the BLAKE2S hash of a string or byte array, and returns a Uint8Array
//
// Returns a n-byte Uint8Array
//
// Parameters:
// - input - the input bytes, as a string, Buffer, or Uint8Array
// - key - optional key Uint8Array, up to 32 bytes
// - outlen - optional output length in bytes, default 64
function blake2s (input, key, outlen) {
  // preprocess inputs
  outlen = outlen || 32;
  input = util.normalizeInput(input);

  // do the math
  const ctx = blake2sInit(outlen, key);
  blake2sUpdate(ctx, input);
  return blake2sFinal(ctx)
}

// Computes the BLAKE2S hash of a string or byte array
//
// Returns an n-byte hash in hex, all lowercase
//
// Parameters:
// - input - the input bytes, as a string, Buffer, or Uint8Array
// - key - optional key Uint8Array, up to 32 bytes
// - outlen - optional output length in bytes, default 64
function blake2sHex (input, key, outlen) {
  const output = blake2s(input, key, outlen);
  return util.toHex(output)
}

var blake2s_1 = {
  blake2s: blake2s,
  blake2sHex: blake2sHex,
  blake2sInit: blake2sInit,
  blake2sUpdate: blake2sUpdate,
  blake2sFinal: blake2sFinal
};

const b2b = blake2b_1;
const b2s = blake2s_1;

var blakejs = {
  blake2b: b2b.blake2b,
  blake2bHex: b2b.blake2bHex,
  blake2bInit: b2b.blake2bInit,
  blake2bUpdate: b2b.blake2bUpdate,
  blake2bFinal: b2b.blake2bFinal,
  blake2s: b2s.blake2s,
  blake2sHex: b2s.blake2sHex,
  blake2sInit: b2s.blake2sInit,
  blake2sUpdate: b2s.blake2sUpdate,
  blake2sFinal: b2s.blake2sFinal
};

// @ts-nocheck
function hexToBytes$1(hex) {
    const result = new Uint8Array(hex.length / 2);
    for (let ii = 0; ii < result.length; ++ii) {
        result[ii] = parseInt(hex.substring((ii * 2) + 0, (ii * 2) + 2), 16);
    }
    return result;
}
const gf = function (init) {
    let i;
    const r = new Float64Array(16);
    if (init) {
        for (i = 0; i < init.length; i++) {
            r[i] = init[i];
        }
    }
    return r;
};
const _9 = new Uint8Array(32);
_9[0] = 9;
const gf0 = gf();
const gf1 = gf([1]);
gf([0xdb41, 1]);
gf([0x78a3, 0x1359, 0x4dca, 0x75eb, 0xd8ab, 0x4141, 0x0a4d, 0x0070, 0xe898, 0x7779, 0x4079,
    0x8cc7, 0xfe73, 0x2b6f, 0x6cee, 0x5203]);
const D2 = gf([0xf159, 0x26b2, 0x9b94, 0xebd6, 0xb156, 0x8283, 0x149a, 0x00e0, 0xd130, 0xeef3, 0x80f2, 0x198e,
    0xfce7, 0x56df, 0xd9dc, 0x2406]);
const X = gf([0xd51a, 0x8f25, 0x2d60, 0xc956, 0xa7b2, 0x9525, 0xc760, 0x692c, 0xdc5c, 0xfdd6, 0xe231, 0xc0a4, 0x53fe, 0xcd6e,
    0x36d3, 0x2169]);
const Y = gf([0x6658, 0x6666, 0x6666, 0x6666, 0x6666, 0x6666, 0x6666, 0x6666, 0x6666, 0x6666, 0x6666, 0x6666, 0x6666, 0x6666, 0x6666, 0x6666]);
gf([
    0xa0b0, 0x4a0e, 0x1b27, 0xc4ee, 0xe478, 0xad2f, 0x1806, 0x2f43, 0xd7a7, 0x3dfb, 0x0099, 0x2b4d, 0xdf0b, 0x4fc1, 0x2480, 0x2b83
]);
function set25519(r, a) {
    let i;
    for (i = 0; i < 16; i++) {
        r[i] = a[i] | 0;
    }
}
function car25519(o) {
    let c;
    let i;
    for (i = 0; i < 16; i++) {
        o[i] += 65536;
        c = Math.floor(o[i] / 65536);
        o[(i + 1) * (i < 15 ? 1 : 0)] += c - 1 + 37 * (c - 1) * (i === 15 ? 1 : 0);
        o[i] -= (c * 65536);
    }
}
function sel25519(p, q, b) {
    let t;
    const c = ~(b - 1);
    for (let i = 0; i < 16; i++) {
        t = c & (p[i] ^ q[i]);
        p[i] ^= t;
        q[i] ^= t;
    }
}
function pack25519(o, n) {
    let i;
    let j;
    let b;
    const m = gf();
    const t = gf();
    for (i = 0; i < 16; i++) {
        t[i] = n[i];
    }
    car25519(t);
    car25519(t);
    car25519(t);
    for (j = 0; j < 2; j++) {
        m[0] = t[0] - 0xffed;
        for (i = 1; i < 15; i++) {
            m[i] = t[i] - 0xffff - ((m[i - 1] >> 16) & 1);
            m[i - 1] &= 0xffff;
        }
        m[15] = t[15] - 0x7fff - ((m[14] >> 16) & 1);
        b = (m[15] >> 16) & 1;
        m[14] &= 0xffff;
        sel25519(t, m, 1 - b);
    }
    for (i = 0; i < 16; i++) {
        o[2 * i] = t[i] & 0xff;
        o[2 * i + 1] = t[i] >> 8;
    }
}
function par25519(a) {
    const d = new Uint8Array(32);
    pack25519(d, a);
    return d[0] & 1;
}
function A(o, a, b) {
    let i;
    for (i = 0; i < 16; i++) {
        o[i] = (a[i] + b[i]) | 0;
    }
}
function Z(o, a, b) {
    let i;
    for (i = 0; i < 16; i++) {
        o[i] = (a[i] - b[i]) | 0;
    }
}
function M(o, a, b) {
    let i;
    let j;
    const t = new Float64Array(31);
    for (i = 0; i < 31; i++) {
        t[i] = 0;
    }
    for (i = 0; i < 16; i++) {
        for (j = 0; j < 16; j++) {
            t[i + j] += a[i] * b[j];
        }
    }
    for (i = 0; i < 15; i++) {
        t[i] += 38 * t[i + 16];
    }
    for (i = 0; i < 16; i++) {
        o[i] = t[i];
    }
    car25519(o);
    car25519(o);
}
function S(o, a) {
    M(o, a, a);
}
function inv25519(o, i) {
    const c = gf();
    let a;
    for (a = 0; a < 16; a++) {
        c[a] = i[a];
    }
    for (a = 253; a >= 0; a--) {
        S(c, c);
        if (a !== 2 && a !== 4) {
            M(c, c, i);
        }
    }
    for (a = 0; a < 16; a++) {
        o[a] = c[a];
    }
}
function add(p, q) {
    const a = gf();
    const b = gf();
    const c = gf();
    const d = gf();
    const e = gf();
    const f = gf();
    const g = gf();
    const h = gf();
    const t = gf();
    Z(a, p[1], p[0]);
    Z(t, q[1], q[0]);
    M(a, a, t);
    A(b, p[0], p[1]);
    A(t, q[0], q[1]);
    M(b, b, t);
    M(c, p[3], q[3]);
    M(c, c, D2);
    M(d, p[2], q[2]);
    A(d, d, d);
    Z(e, b, a);
    Z(f, d, c);
    A(g, d, c);
    A(h, b, a);
    M(p[0], e, f);
    M(p[1], h, g);
    M(p[2], g, f);
    M(p[3], e, h);
}
function cswap(p, q, b) {
    let i;
    for (i = 0; i < 4; i++) {
        sel25519(p[i], q[i], b);
    }
}
function pack(r, p) {
    const tx = gf();
    const ty = gf();
    const zi = gf();
    inv25519(zi, p[2]);
    M(tx, p[0], zi);
    M(ty, p[1], zi);
    pack25519(r, ty);
    r[31] ^= par25519(tx) << 7;
}
function scalarmult(p, q, s) {
    let b;
    let i;
    set25519(p[0], gf0);
    set25519(p[1], gf1);
    set25519(p[2], gf1);
    set25519(p[3], gf0);
    for (i = 255; i >= 0; --i) {
        b = (s[(i / 8) | 0] >> (i & 7)) & 1;
        cswap(p, q, b);
        add(q, p);
        add(p, p);
        cswap(p, q, b);
    }
}
function scalarbase(p, s) {
    const q = [gf(), gf(), gf(), gf()];
    set25519(q[0], X);
    set25519(q[1], Y);
    set25519(q[2], gf1);
    M(q[3], X, Y);
    scalarmult(p, q, s);
}
const uint5ToUint4 = (uint5) => {
    const length = uint5.length / 4 * 5;
    const uint4 = new Uint8Array(length);
    for (let i = 1; i <= length; i++) {
        const n = i - 1;
        const m = i % 5;
        const z = n - ((i - m) / 5);
        const right = uint5[z - 1] << (5 - m);
        const left = uint5[z] >> m;
        uint4[n] = (left + right) % 16;
    }
    return uint4;
};
const arrayCrop = (array) => {
    const length = array.length - 1;
    const croppedArray = new Uint8Array(length);
    for (let i = 0; i < length; i++) {
        croppedArray[i] = array[i + 1];
    }
    return croppedArray;
};
const uint4ToHex = (uint4) => {
    let hex = '';
    for (let i = 0; i < uint4.length; i++) {
        hex += uint4[i].toString(16).toUpperCase();
    }
    return hex;
};
const uint8ToUint4 = (uintValue) => {
    const uint4 = new Uint8Array(uintValue.length * 2);
    for (let i = 0; i < uintValue.length; i++) {
        uint4[i * 2] = uintValue[i] / 16 | 0;
        uint4[i * 2 + 1] = uintValue[i] % 16;
    }
    return uint4;
};
const equalArrays = (array1, array2) => {
    for (let i = 0; i < array1.length; i++) {
        if (array1[i] != array2[i])
            return false;
    }
    return true;
};
const uint4ToUint8 = (uintValue) => {
    const length = uintValue.length / 2;
    const uint8 = new Uint8Array(length);
    for (let i = 0; i < length; i++) {
        uint8[i] = (uintValue[i * 2] * 16) + uintValue[i * 2 + 1];
    }
    return uint8;
};
const stringToUint5 = (string) => {
    const letterList = '13456789abcdefghijkmnopqrstuwxyz'.split('');
    const length = string.length;
    const stringArray = string.split('');
    const uint5 = new Uint8Array(length);
    for (let i = 0; i < length; i++) {
        uint5[i] = letterList.indexOf(stringArray[i]);
    }
    return uint5;
};
const hexToUint4 = (hexValue) => {
    const uint4 = new Uint8Array(hexValue.length);
    for (let i = 0; i < hexValue.length; i++) {
        uint4[i] = parseInt(hexValue.substr(i, 1), 16);
    }
    return uint4;
};
const uint4ToUint5 = (uintValue) => {
    const length = uintValue.length / 5 * 4;
    const uint5 = new Uint8Array(length);
    for (let i = 1; i <= length; i++) {
        const n = i - 1;
        const m = i % 4;
        const z = n + ((i - m) / 4);
        const right = uintValue[z] << m;
        let left;
        if (((length - i) % 4) == 0) {
            left = uintValue[z - 1] << 4;
        }
        else {
            left = uintValue[z + 1] >> (4 - m);
        }
        uint5[n] = (left + right) % 32;
    }
    return uint5;
};
const uint5ToString = (uint5) => {
    const letterList = '13456789abcdefghijkmnopqrstuwxyz'.split('');
    let string = '';
    for (let i = 0; i < uint5.length; i++) {
        string += letterList[uint5[i]];
    }
    return string;
};
const L = new Float64Array([0xed, 0xd3, 0xf5, 0x5c, 0x1a, 0x63, 0x12, 0x58, 0xd6, 0x9c, 0xf7, 0xa2, 0xde, 0xf9, 0xde, 0x14, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
    0, 0, 0, 0x10]);
function modL(r, x) {
    let carry;
    let i;
    let j;
    let k;
    for (i = 63; i >= 32; --i) {
        carry = 0;
        for (j = i - 32, k = i - 12; j < k; ++j) {
            x[j] += carry - 16 * x[i] * L[j - (i - 32)];
            carry = (x[j] + 128) >> 8;
            x[j] -= carry * 256;
        }
        x[j] += carry;
        x[i] = 0;
    }
    carry = 0;
    for (j = 0; j < 32; j++) {
        x[j] += carry - (x[31] >> 4) * L[j];
        carry = x[j] >> 8;
        x[j] &= 255;
    }
    for (j = 0; j < 32; j++) {
        x[j] -= carry * L[j];
    }
    for (i = 0; i < 32; i++) {
        x[i + 1] += x[i] >> 8;
        r[i] = x[i] & 255;
    }
}
function reduce(r) {
    const x = new Float64Array(64);
    let i;
    for (i = 0; i < 64; i++) {
        x[i] = r[i];
    }
    for (i = 0; i < 64; i++) {
        r[i] = 0;
    }
    modL(r, x);
}
// Note: difference from C - smlen returned, not passed as argument.
function crypto_sign(sm, m, n, sk) {
    let d = new Uint8Array(64);
    let h = new Uint8Array(64);
    let r = new Uint8Array(64);
    let i;
    let j;
    const x = new Float64Array(64);
    const p = [gf(), gf(), gf(), gf()];
    const pk = derivePublicKeyFromPrivateKey(sk);
    let context = blakejs.blake2bInit(64, null);
    blakejs.blake2bUpdate(context, sk);
    d = blakejs.blake2bFinal(context);
    d[0] &= 248;
    d[31] &= 127;
    d[31] |= 64;
    const smlen = n + 64;
    for (i = 0; i < n; i++) {
        sm[64 + i] = m[i];
    }
    for (i = 0; i < 32; i++) {
        sm[32 + i] = d[32 + i];
    }
    context = blakejs.blake2bInit(64, null);
    blakejs.blake2bUpdate(context, sm.subarray(32));
    r = blakejs.blake2bFinal(context);
    reduce(r);
    scalarbase(p, r);
    pack(sm, p);
    for (i = 32; i < 64; i++) {
        sm[i] = pk[i - 32];
    }
    context = blakejs.blake2bInit(64, null);
    blakejs.blake2bUpdate(context, sm);
    h = blakejs.blake2bFinal(context);
    reduce(h);
    for (i = 0; i < 64; i++) {
        x[i] = 0;
    }
    for (i = 0; i < 32; i++) {
        x[i] = r[i];
    }
    for (i = 0; i < 32; i++) {
        for (j = 0; j < 32; j++) {
            x[i + j] += h[i] * d[j];
        }
    }
    modL(sm.subarray(32), x);
    return smlen;
}
function deriveAddressFromPublicKey(publicKey) {
    const keyBytes = uint4ToUint8(hexToUint4(publicKey)); // For some reason here we go from u, to hex, to 4, to 8??
    const checksum = uint5ToString(uint4ToUint5(uint8ToUint4(blakejs.blake2b(keyBytes, null, 5).reverse())));
    const address = uint5ToString(uint4ToUint5(hexToUint4(`0${publicKey}`)));
    return `ban_${address}${checksum}`;
}
function derivePublicKeyFromPrivateKey(privateKey) {
    let d = new Uint8Array(64);
    const p = [gf(), gf(), gf(), gf()];
    const pk = new Uint8Array(32);
    const context = blakejs.blake2bInit(64);
    blakejs.blake2bUpdate(context, privateKey);
    d = blakejs.blake2bFinal(context);
    d[0] &= 248;
    d[31] &= 127;
    d[31] |= 64;
    scalarbase(p, d);
    pack(pk, p);
    return pk;
}
function derivePublicKeyFromAddress(address) {
    let addressCrop = address.substring(4, 64);
    const keyUint4 = arrayCrop(uint5ToUint4(stringToUint5(addressCrop.substring(0, 52))));
    const hashUint4 = uint5ToUint4(stringToUint5(addressCrop.substring(52, 60)));
    const keyArray = uint4ToUint8(keyUint4);
    const blakeHash = blakejs.blake2b(keyArray, null, 5).reverse();
    const left = hashUint4;
    const right = uint8ToUint4(blakeHash);
    if (!equalArrays(left, right)) {
        const leftStr = uint5ToString(uint4ToUint5(left));
        const rightStr = uint5ToString(uint4ToUint5(right));
        throw new Error(`Incorrect checksum ${leftStr} != ${rightStr}`);
    }
    return hexToBytes$1(uint4ToHex(keyUint4));
}
function signHash(privateKey, hash) {
    const signedMsg = new Uint8Array(64 + hash.length);
    crypto_sign(signedMsg, hash, hash.length, privateKey);
    const sig = new Uint8Array(64);
    for (let i = 0; i < sig.length; i++) {
        sig[i] = signedMsg[i];
    }
    return sig;
}

const SEED_ALPHABET_REGEX = new RegExp(`^[0123456789abcdefABCDEF]{64}$`);
/**
 * Converts the provided hex into the equivalent bytes
 * @param hex - The hex to convert
 */
function hexToBytes(hex) {
    const result = new Uint8Array(hex.length / 2);
    for (let ii = 0; ii < result.length; ++ii) {
        result[ii] = parseInt(hex.substring((ii * 2) + 0, (ii * 2) + 2), 16);
    }
    return result;
}
/**
 * Converts the provided bytes into their hexadecimal equivalent
 * @param bytes - The bytes to convert
 */
function bytesToHex(bytes) {
    return Array.prototype.map.call(bytes, (x) => ("00" + x.toString(16)).slice(-2)).join("").toUpperCase();
}
/**
 * Converts the provided bytes into their bit equivalent
 * @param bytes - The bytes to convert
 */
function bytesToBits(bytes) {
    const bits = new Uint8Array(bytes.length * 8);
    for (let ii = 0; ii < bytes.length; ++ii) {
        const byte = bytes[ii];
        for (let bb = 7; bb >= 0; --bb) {
            bits[(ii * 8) + (7 - bb)] = byte & (1 << bb) ? 1 : 0;
        }
    }
    return bits;
}
/**
 * Converts the provided decimal value into the hexadecimal equivalent
 * @param decimal - The decimal value to convert
 * @param bytes - The byte stride of the provided value
 */
function decimalToHex(decimal, bytes) {
    const dec = decimal.toString().split("");
    const sum = [];
    let hex = "";
    const hexArray = [];
    while (dec.length) {
        let s = 1 * Number(dec.shift());
        for (let ii = 0; s || ii < sum.length; ++ii) {
            s += (sum[ii] || 0) * 10;
            sum[ii] = s % 16;
            s = (s - sum[ii]) / 16;
        }
    }
    while (sum.length) {
        hexArray.push(sum.pop().toString(16));
    }
    hex = hexArray.join("");
    if (hex.length % 2 != 0)
        hex = "0" + hex;
    if (bytes > hex.length / 2) {
        const diff = bytes - (hex.length / 2);
        for (let j = 0; j < diff; j++) {
            hex = "00" + hex;
        }
    }
    return hex;
}
/**
 * Indicates if the provided seed is valid
 * @param seed - The seed to check
 */
function isSeedValid(seed) {
    return SEED_ALPHABET_REGEX.test(bytesToHex(seed));
}
/**
 * Indicates if the provided hash and work bytes are valid
 * @param hash - The hash to validate
 * @param work - The work to validate
 * @param workMin - The minimum value of the work
 */
function isWorkValid(hash, work, workMin) {
    const context = blakejs.blake2bInit(8);
    blakejs.blake2bUpdate(context, work);
    blakejs.blake2bUpdate(context, hash);
    const output = blakejs.blake2bFinal(context).reverse();
    const outputHex = bytesToHex(output);
    const outputBigInt = BigInt("0x" + outputHex);
    return outputBigInt > workMin;
}
/**
 * Converts the provided amount into raw amount
 * @param amount - The amount to convert
 */
function getRawFromAmount(amount) {
    const decimalPlace = amount.indexOf(".");
    let divisor = BigInt("1");
    if (decimalPlace !== -1) {
        amount = amount.replace(".", "");
        const decimalsAfter = amount.length - decimalPlace;
        divisor = BigInt("10") ** BigInt(decimalsAfter);
    }
    const amountBi = BigInt(amount);
    const majorDivisor = BigInt(`100000000000000000000000000000`);
    const amountRaw = (amountBi * majorDivisor) / divisor;
    return amountRaw;
}
/**
 * Converts the provided raw amount into amount
 * @param amountRaw - The raw amount to convert
 */
function getAmountFromRaw(amountRaw) {
    const minorDivisor = BigInt(`1000000000000000000000000000`);
    const majorDivisor = BigInt(`100000000000000000000000000000`);
    const major = amountRaw / majorDivisor;
    const majorRawRemainder = amountRaw - (major * majorDivisor);
    const minor = majorRawRemainder / minorDivisor;
    const banano = major.toString();
    const banoshi = minor.toString();
    const amount = banano + "." + banoshi.padStart(2, "0");
    return amount;
}
/**
 * Returns the private key of the provided seed
 * @param seed - The seed to derive from
 * @param seedIx - The seed index
 */
function getPrivateKey(seed, seedIx = 0) {
    if (!isSeedValid(seed))
        throw new Error(`Invalid seed '${seed}'`);
    const accountBytes = hexToBytes(decimalToHex(seedIx, 4));
    const context = blakejs.blake2bInit(32);
    blakejs.blake2bUpdate(context, seed);
    blakejs.blake2bUpdate(context, accountBytes);
    return blakejs.blake2bFinal(context);
}
/**
 * Returns the public key of the provided input
 * @param input - The private key or address to derive from
 */
function getPublicKey(input) {
    // Get public key from address string
    if (typeof input === "string") {
        return derivePublicKeyFromAddress(input);
    }
    // Get public key from private key array
    return derivePublicKeyFromPrivateKey(input);
}
/**
 * Returns the relative address of the public key
 * @param publicKey - The public key to derive the address from
 */
function getAccountAddress(publicKey) {
    return deriveAddressFromPublicKey(bytesToHex(publicKey));
}

/**
 * Parses the provided json into an abstract representation
 * @param json - The json to parse
 */
function parseAccountBalanceResponse(json) {
    try {
        const balance = Object.values(json.balances)[0];
        const output = {
            balance: BigInt(balance.balance),
            pending: BigInt(balance.pending),
        };
        return output;
    }
    catch (e) { }
    return null;
}

/**
 * Represents an account history item action
 */
var ACCOUNT_HISTORY_ITEM_ACTION;
(function (ACCOUNT_HISTORY_ITEM_ACTION) {
    /**
     * History item send action
     */
    ACCOUNT_HISTORY_ITEM_ACTION[ACCOUNT_HISTORY_ITEM_ACTION["SEND"] = 0] = "SEND";
    /**
     * History item receive action
     */
    ACCOUNT_HISTORY_ITEM_ACTION[ACCOUNT_HISTORY_ITEM_ACTION["RECEIVE"] = 1] = "RECEIVE";
})(ACCOUNT_HISTORY_ITEM_ACTION || (ACCOUNT_HISTORY_ITEM_ACTION = {}));
/**
 * Parses the provided json into an abstract representation
 * @param json - The json to parse
 */
function parseAccountHistoryResponse(json) {
    try {
        if (Array.isArray(json.history)) {
            const output = {
                history: []
            };
            for (const history of json.history) {
                output.history.push({
                    hash: hexToBytes(history.hash),
                    amount: BigInt(history.amount),
                    account: derivePublicKeyFromAddress(history.account),
                    action: history.type === "send" ? ACCOUNT_HISTORY_ITEM_ACTION.SEND : ACCOUNT_HISTORY_ITEM_ACTION.RECEIVE,
                });
            }
            return output;
        }
    }
    catch (e) { }
    return null;
}

/**
 * Parses the provided json into an abstract representation
 * @param json - The json to parse
 */
function parseAccountInfoResponse(json) {
    try {
        const output = {
            blockCount: parseInt(json.block_count),
            frontier: hexToBytes(json.frontier),
            representativeBlock: hexToBytes(json.representative_block),
            modificationTimestamp: parseInt(json.modified_timestamp),
        };
        return output;
    }
    catch (e) { }
    return null;
}

/**
 * Parses the provided json into an abstract representation
 * @param json - The json to parse
 */
function parseAccountPendingResponse(json) {
    try {
        const output = {
            blocks: []
        };
        const blocks = Object.values(json.blocks)[0];
        for (const [key, value] of Object.entries(blocks)) {
            const { amount, source } = value;
            const item = {
                amount: BigInt(amount),
                hash: hexToBytes(key),
                source: derivePublicKeyFromAddress(source)
            };
            output.blocks.push(item);
        }
        return output;
    }
    catch (e) { }
    return null;
}

/**
 * Parses the provided json into an abstract representation
 * @param json - The json to parse
 */
function parseAccountRepresentativeResponse(json) {
    try {
        const output = {
            account: derivePublicKeyFromAddress(json.representative)
        };
        return output;
    }
    catch (e) { }
    return null;
}

var vertSource = "#version 300 es\nprecision highp float;\n#define GLSLIFY 1\nconst vec2 vertices[4]=vec2[](vec2(-1,+1),vec2(-1,-1),vec2(+1,+1),vec2(+1,-1));void main(){gl_Position=vec4(vertices[gl_VertexID],0.0,1.0);}"; // eslint-disable-line

var fragSource = "#version 300 es\nprecision highp float;precision highp int;\n#define GLSLIFY 1\nout vec4 fragColor;uniform uvec4 uWork0;uniform uvec4 uWork1;uniform uvec4 uHash0;uniform uvec4 uHash1;\n#define BLAKE2B_IV32_1 0x6A09E667u\nuint v[32]=uint[32](0xF2BDC900u,0x6A09E667u,0x84CAA73Bu,0xBB67AE85u,0xFE94F82Bu,0x3C6EF372u,0x5F1D36F1u,0xA54FF53Au,0xADE682D1u,0x510E527Fu,0x2B3E6C1Fu,0x9B05688Cu,0xFB41BD6Bu,0x1F83D9ABu,0x137E2179u,0x5BE0CD19u,0xF3BCC908u,0x6A09E667u,0x84CAA73Bu,0xBB67AE85u,0xFE94F82Bu,0x3C6EF372u,0x5F1D36F1u,0xA54FF53Au,0xADE682F9u,0x510E527Fu,0x2B3E6C1Fu,0x9B05688Cu,0x04BE4294u,0xE07C2654u,0x137E2179u,0x5BE0CD19u);uint m[32];const int SIGMA82[192]=int[192](0,2,4,6,8,10,12,14,16,18,20,22,24,26,28,30,28,20,8,16,18,30,26,12,2,24,0,4,22,14,10,6,22,16,24,0,10,4,30,26,20,28,6,12,14,2,18,8,14,18,6,2,26,24,22,28,4,12,10,20,8,0,30,16,18,0,10,14,4,8,20,30,28,2,22,24,12,16,6,26,4,24,12,20,0,22,16,6,8,26,14,10,30,28,2,18,24,10,2,30,28,26,8,20,0,14,12,6,18,4,16,22,26,22,14,28,24,2,6,18,10,0,30,8,16,12,4,20,12,30,28,18,22,6,0,16,24,4,26,14,2,8,20,10,20,4,16,8,14,12,2,10,30,22,18,28,6,24,26,0,0,2,4,6,8,10,12,14,16,18,20,22,24,26,28,30,28,20,8,16,18,30,26,12,2,24,0,4,22,14,10,6);void add_uint64(int a,uint b0,uint b1){uint o0=v[a]+b0;uint o1=v[a+1]+b1;if(v[a]>0xFFFFFFFFu-b0){o1++;}v[a]=o0;v[a+1]=o1;}void add_uint64(int a,int b){add_uint64(a,v[b],v[b+1]);}void B2B_G(int a,int b,int c,int d,int ix,int iy){add_uint64(a,b);add_uint64(a,m[ix],m[ix+1]);uint xor0=v[d]^ v[a];uint xor1=v[d+1]^ v[a+1];v[d]=xor1;v[d+1]=xor0;add_uint64(c,d);xor0=v[b]^ v[c];xor1=v[b+1]^ v[c+1];v[b]=(xor0>>24)^(xor1<<8);v[b+1]=(xor1>>24)^(xor0<<8);add_uint64(a,b);add_uint64(a,m[iy],m[iy+1]);xor0=v[d]^ v[a];xor1=v[d+1]^ v[a+1];v[d]=(xor0>>16)^(xor1<<16);v[d+1]=(xor1>>16)^(xor0<<16);add_uint64(c,d);xor0=v[b]^ v[c];xor1=v[b+1]^ v[c+1];v[b]=(xor1>>31)^(xor0<<1);v[b+1]=(xor0>>31)^(xor1<<1);}void main(){int i;uint uv_x=uint(gl_FragCoord.x);uint uv_y=uint(gl_FragCoord.y);uint x_pos=uv_x % 256u;uint y_pos=uv_y % 256u;uint x_index=(uv_x-x_pos)/256u;uint y_index=(uv_y-y_pos)/256u;m[0]=(x_pos ^(y_pos<<8)^((uWork0.b ^ x_index)<<16)^((uWork0.a ^ y_index)<<24));m[1]=(uWork1.r ^(uWork1.g<<8)^(uWork1.b<<16)^(uWork1.a<<24));m[2]=uHash0[0];m[3]=uHash0[1];m[4]=uHash0[2];m[5]=uHash0[3];m[6]=uHash1[0];m[7]=uHash1[1];m[8]=uHash1[2];m[9]=uHash1[3];for(i=0;i<12;i++){B2B_G(0,8,16,24,SIGMA82[i*16+0],SIGMA82[i*16+1]);B2B_G(2,10,18,26,SIGMA82[i*16+2],SIGMA82[i*16+3]);B2B_G(4,12,20,28,SIGMA82[i*16+4],SIGMA82[i*16+5]);B2B_G(6,14,22,30,SIGMA82[i*16+6],SIGMA82[i*16+7]);B2B_G(0,10,20,30,SIGMA82[i*16+8],SIGMA82[i*16+9]);B2B_G(2,12,22,24,SIGMA82[i*16+10],SIGMA82[i*16+11]);B2B_G(4,14,16,26,SIGMA82[i*16+12],SIGMA82[i*16+13]);B2B_G(6,8,18,28,SIGMA82[i*16+14],SIGMA82[i*16+15]);}if((BLAKE2B_IV32_1 ^ v[1]^ v[17])>0xFFFFFE00u){fragColor=vec4(float(x_index+1u)/255.,float(y_index+1u)/255.,float(x_pos)/255.,float(y_pos)/255.);}}"; // eslint-disable-line

function arrayHex(arr, length) {
    let out = "";
    for (let i = length - 1; i > -1; i--) {
        out += (arr[i] > 15 ? "" : "0") + arr[i].toString(16);
    }
    return out;
}
function hexReverse(hex) {
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
function getWorkGPU(hash, dimension = 1) {
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

/**
 * Parses the provided json into an abstract representation
 * @param json - The json to parse
 */
function parseBlockProcessResponse(json) {
    try {
        const output = {
            hash: hexToBytes(json.hash)
        };
        return output;
    }
    catch (e) { }
    return null;
}

var QRMode;
(function (QRMode) {
    QRMode[QRMode["MODE_NUMBER"] = 1] = "MODE_NUMBER";
    QRMode[QRMode["MODE_ALPHA_NUM"] = 2] = "MODE_ALPHA_NUM";
    QRMode[QRMode["MODE_8BIT_BYTE"] = 4] = "MODE_8BIT_BYTE";
    QRMode[QRMode["MODE_KANJI"] = 8] = "MODE_KANJI";
})(QRMode || (QRMode = {}));

class QR8bitByte {
    constructor(data) {
        this.mode = QRMode.MODE_8BIT_BYTE;
        this.data = this.toUTF8(data);
    }
    getLength() {
        return this.data.length;
    }
    write(buffer) {
        for (var i = 0; i < this.data.length; i++) {
            // not JIS ...
            buffer.put(this.data.charCodeAt(i), 8);
        }
    }
    toUTF8(str) {
        var out, i, len, c;
        out = '';
        len = str.length;
        for (i = 0; i < len; i++) {
            c = str.charCodeAt(i);
            if (c >= 0x0001 && c <= 0x007f) {
                out += str.charAt(i);
            }
            else if (c > 0x07ff) {
                out += String.fromCharCode(0xe0 | ((c >> 12) & 0x0f));
                out += String.fromCharCode(0x80 | ((c >> 6) & 0x3f));
                out += String.fromCharCode(0x80 | ((c >> 0) & 0x3f));
            }
            else {
                out += String.fromCharCode(0xc0 | ((c >> 6) & 0x1f));
                out += String.fromCharCode(0x80 | ((c >> 0) & 0x3f));
            }
        }
        return out;
    }
}

class QRBitBuffer {
    constructor() {
        this.buffer = new Array();
        this.length = 0;
    }
    get(index) {
        var bufIndex = Math.floor(index / 8);
        return ((this.buffer[bufIndex] >>> (7 - (index % 8))) & 1) == 1;
    }
    put(num, length) {
        for (var i = 0; i < length; i++) {
            this.putBit(((num >>> (length - i - 1)) & 1) == 1);
        }
    }
    getLengthInBits() {
        return this.length;
    }
    putBit(bit) {
        var bufIndex = Math.floor(this.length / 8);
        if (this.buffer.length <= bufIndex) {
            this.buffer.push(0);
        }
        if (bit) {
            this.buffer[bufIndex] |= 0x80 >>> this.length % 8;
        }
        this.length++;
    }
}

const exps = new Array(256);
const logs = new Array(256);
for (var i = 0; i < 8; i++) {
    exps[i] = 1 << i;
}
for (var i = 8; i < 256; i++) {
    exps[i] = exps[i - 4] ^ exps[i - 5] ^ exps[i - 6] ^ exps[i - 8];
}
for (var i = 0; i < 255; i++) {
    logs[exps[i]] = i;
}
class QRMath {
    static glog(n) {
        if (n < 1) {
            throw new Error('glog(' + n + ')');
        }
        return QRMath.LOG_TABLE[n];
    }
    static gexp(n) {
        while (n < 0) {
            n += 255;
        }
        while (n >= 256) {
            n -= 255;
        }
        return QRMath.EXP_TABLE[n];
    }
}
QRMath.EXP_TABLE = exps;
QRMath.LOG_TABLE = logs;

class QRPolynomial {
    constructor(num, shift) {
        this.num = num;
        if (num.length == undefined) {
            throw new Error(num.length + '/' + shift);
        }
        var offset = 0;
        while (offset < num.length && num[offset] == 0) {
            offset++;
        }
        this.num = new Array(num.length - offset + shift);
        for (var i = 0; i < num.length - offset; i++) {
            this.num[i] = num[i + offset];
        }
    }
    get(index) {
        return this.num[index];
    }
    getLength() {
        return this.num.length;
    }
    multiply(e) {
        var num = new Array(this.getLength() + e.getLength() - 1);
        for (var i = 0; i < this.getLength(); i++) {
            for (var j = 0; j < e.getLength(); j++) {
                num[i + j] ^= QRMath.gexp(QRMath.glog(this.get(i)) + QRMath.glog(e.get(j)));
            }
        }
        return new QRPolynomial(num, 0);
    }
    mod(e) {
        if (this.getLength() - e.getLength() < 0) {
            return this;
        }
        var ratio = QRMath.glog(this.get(0)) - QRMath.glog(e.get(0));
        var num = new Array(this.getLength());
        for (var i = 0; i < this.getLength(); i++) {
            num[i] = this.get(i);
        }
        for (var i = 0; i < e.getLength(); i++) {
            num[i] ^= QRMath.gexp(QRMath.glog(e.get(i)) + ratio);
        }
        // recursive call
        return new QRPolynomial(num, 0).mod(e);
    }
}

var QRErrorCorrectLevel;
(function (QRErrorCorrectLevel) {
    QRErrorCorrectLevel[QRErrorCorrectLevel["L"] = 1] = "L";
    QRErrorCorrectLevel[QRErrorCorrectLevel["M"] = 0] = "M";
    QRErrorCorrectLevel[QRErrorCorrectLevel["Q"] = 3] = "Q";
    QRErrorCorrectLevel[QRErrorCorrectLevel["H"] = 2] = "H";
})(QRErrorCorrectLevel || (QRErrorCorrectLevel = {}));

class QRRSBlock {
    constructor(totalCount, dataCount) {
        this.totalCount = totalCount;
        this.dataCount = dataCount;
    }
    static getRSBlocks(typeNumber, errorCorrectLevel) {
        var rsBlock = QRRSBlock.getRsBlockTable(typeNumber, errorCorrectLevel);
        if (rsBlock == undefined) {
            throw new Error('bad rs block @ typeNumber:' +
                typeNumber +
                '/errorCorrectLevel:' +
                errorCorrectLevel);
        }
        var length = rsBlock.length / 3;
        var list = [];
        for (var i = 0; i < length; i++) {
            var count = rsBlock[i * 3 + 0];
            var totalCount = rsBlock[i * 3 + 1];
            var dataCount = rsBlock[i * 3 + 2];
            for (var j = 0; j < count; j++) {
                list.push(new QRRSBlock(totalCount, dataCount));
            }
        }
        return list;
    }
    static getRsBlockTable(typeNumber, errorCorrectLevel) {
        switch (errorCorrectLevel) {
            case QRErrorCorrectLevel.L:
                return QRRSBlock.RS_BLOCK_TABLE[(typeNumber - 1) * 4 + 0];
            case QRErrorCorrectLevel.M:
                return QRRSBlock.RS_BLOCK_TABLE[(typeNumber - 1) * 4 + 1];
            case QRErrorCorrectLevel.Q:
                return QRRSBlock.RS_BLOCK_TABLE[(typeNumber - 1) * 4 + 2];
            case QRErrorCorrectLevel.H:
                return QRRSBlock.RS_BLOCK_TABLE[(typeNumber - 1) * 4 + 3];
            default:
                return undefined;
        }
    }
}
QRRSBlock.RS_BLOCK_TABLE = [
    // L
    // M
    // Q
    // H
    // 1
    [1, 26, 19],
    [1, 26, 16],
    [1, 26, 13],
    [1, 26, 9],
    // 2
    [1, 44, 34],
    [1, 44, 28],
    [1, 44, 22],
    [1, 44, 16],
    // 3
    [1, 70, 55],
    [1, 70, 44],
    [2, 35, 17],
    [2, 35, 13],
    // 4
    [1, 100, 80],
    [2, 50, 32],
    [2, 50, 24],
    [4, 25, 9],
    // 5
    [1, 134, 108],
    [2, 67, 43],
    [2, 33, 15, 2, 34, 16],
    [2, 33, 11, 2, 34, 12],
    // 6
    [2, 86, 68],
    [4, 43, 27],
    [4, 43, 19],
    [4, 43, 15],
    // 7
    [2, 98, 78],
    [4, 49, 31],
    [2, 32, 14, 4, 33, 15],
    [4, 39, 13, 1, 40, 14],
    // 8
    [2, 121, 97],
    [2, 60, 38, 2, 61, 39],
    [4, 40, 18, 2, 41, 19],
    [4, 40, 14, 2, 41, 15],
    // 9
    [2, 146, 116],
    [3, 58, 36, 2, 59, 37],
    [4, 36, 16, 4, 37, 17],
    [4, 36, 12, 4, 37, 13],
    // 10
    [2, 86, 68, 2, 87, 69],
    [4, 69, 43, 1, 70, 44],
    [6, 43, 19, 2, 44, 20],
    [6, 43, 15, 2, 44, 16],
    // 11
    [4, 101, 81],
    [1, 80, 50, 4, 81, 51],
    [4, 50, 22, 4, 51, 23],
    [3, 36, 12, 8, 37, 13],
    // 12
    [2, 116, 92, 2, 117, 93],
    [6, 58, 36, 2, 59, 37],
    [4, 46, 20, 6, 47, 21],
    [7, 42, 14, 4, 43, 15],
    // 13
    [4, 133, 107],
    [8, 59, 37, 1, 60, 38],
    [8, 44, 20, 4, 45, 21],
    [12, 33, 11, 4, 34, 12],
    // 14
    [3, 145, 115, 1, 146, 116],
    [4, 64, 40, 5, 65, 41],
    [11, 36, 16, 5, 37, 17],
    [11, 36, 12, 5, 37, 13],
    // 15
    [5, 109, 87, 1, 110, 88],
    [5, 65, 41, 5, 66, 42],
    [5, 54, 24, 7, 55, 25],
    [11, 36, 12],
    // 16
    [5, 122, 98, 1, 123, 99],
    [7, 73, 45, 3, 74, 46],
    [15, 43, 19, 2, 44, 20],
    [3, 45, 15, 13, 46, 16],
    // 17
    [1, 135, 107, 5, 136, 108],
    [10, 74, 46, 1, 75, 47],
    [1, 50, 22, 15, 51, 23],
    [2, 42, 14, 17, 43, 15],
    // 18
    [5, 150, 120, 1, 151, 121],
    [9, 69, 43, 4, 70, 44],
    [17, 50, 22, 1, 51, 23],
    [2, 42, 14, 19, 43, 15],
    // 19
    [3, 141, 113, 4, 142, 114],
    [3, 70, 44, 11, 71, 45],
    [17, 47, 21, 4, 48, 22],
    [9, 39, 13, 16, 40, 14],
    // 20
    [3, 135, 107, 5, 136, 108],
    [3, 67, 41, 13, 68, 42],
    [15, 54, 24, 5, 55, 25],
    [15, 43, 15, 10, 44, 16],
    // 21
    [4, 144, 116, 4, 145, 117],
    [17, 68, 42],
    [17, 50, 22, 6, 51, 23],
    [19, 46, 16, 6, 47, 17],
    // 22
    [2, 139, 111, 7, 140, 112],
    [17, 74, 46],
    [7, 54, 24, 16, 55, 25],
    [34, 37, 13],
    // 23
    [4, 151, 121, 5, 152, 122],
    [4, 75, 47, 14, 76, 48],
    [11, 54, 24, 14, 55, 25],
    [16, 45, 15, 14, 46, 16],
    // 24
    [6, 147, 117, 4, 148, 118],
    [6, 73, 45, 14, 74, 46],
    [11, 54, 24, 16, 55, 25],
    [30, 46, 16, 2, 47, 17],
    // 25
    [8, 132, 106, 4, 133, 107],
    [8, 75, 47, 13, 76, 48],
    [7, 54, 24, 22, 55, 25],
    [22, 45, 15, 13, 46, 16],
    // 26
    [10, 142, 114, 2, 143, 115],
    [19, 74, 46, 4, 75, 47],
    [28, 50, 22, 6, 51, 23],
    [33, 46, 16, 4, 47, 17],
    // 27
    [8, 152, 122, 4, 153, 123],
    [22, 73, 45, 3, 74, 46],
    [8, 53, 23, 26, 54, 24],
    [12, 45, 15, 28, 46, 16],
    // 28
    [3, 147, 117, 10, 148, 118],
    [3, 73, 45, 23, 74, 46],
    [4, 54, 24, 31, 55, 25],
    [11, 45, 15, 31, 46, 16],
    // 29
    [7, 146, 116, 7, 147, 117],
    [21, 73, 45, 7, 74, 46],
    [1, 53, 23, 37, 54, 24],
    [19, 45, 15, 26, 46, 16],
    // 30
    [5, 145, 115, 10, 146, 116],
    [19, 75, 47, 10, 76, 48],
    [15, 54, 24, 25, 55, 25],
    [23, 45, 15, 25, 46, 16],
    // 31
    [13, 145, 115, 3, 146, 116],
    [2, 74, 46, 29, 75, 47],
    [42, 54, 24, 1, 55, 25],
    [23, 45, 15, 28, 46, 16],
    // 32
    [17, 145, 115],
    [10, 74, 46, 23, 75, 47],
    [10, 54, 24, 35, 55, 25],
    [19, 45, 15, 35, 46, 16],
    // 33
    [17, 145, 115, 1, 146, 116],
    [14, 74, 46, 21, 75, 47],
    [29, 54, 24, 19, 55, 25],
    [11, 45, 15, 46, 46, 16],
    // 34
    [13, 145, 115, 6, 146, 116],
    [14, 74, 46, 23, 75, 47],
    [44, 54, 24, 7, 55, 25],
    [59, 46, 16, 1, 47, 17],
    // 35
    [12, 151, 121, 7, 152, 122],
    [12, 75, 47, 26, 76, 48],
    [39, 54, 24, 14, 55, 25],
    [22, 45, 15, 41, 46, 16],
    // 36
    [6, 151, 121, 14, 152, 122],
    [6, 75, 47, 34, 76, 48],
    [46, 54, 24, 10, 55, 25],
    [2, 45, 15, 64, 46, 16],
    // 37
    [17, 152, 122, 4, 153, 123],
    [29, 74, 46, 14, 75, 47],
    [49, 54, 24, 10, 55, 25],
    [24, 45, 15, 46, 46, 16],
    // 38
    [4, 152, 122, 18, 153, 123],
    [13, 74, 46, 32, 75, 47],
    [48, 54, 24, 14, 55, 25],
    [42, 45, 15, 32, 46, 16],
    // 39
    [20, 147, 117, 4, 148, 118],
    [40, 75, 47, 7, 76, 48],
    [43, 54, 24, 22, 55, 25],
    [10, 45, 15, 67, 46, 16],
    // 40
    [19, 148, 118, 6, 149, 119],
    [18, 75, 47, 31, 76, 48],
    [34, 54, 24, 34, 55, 25],
    [20, 45, 15, 61, 46, 16],
];

var QRMaskPattern;
(function (QRMaskPattern) {
    QRMaskPattern[QRMaskPattern["PATTERN000"] = 0] = "PATTERN000";
    QRMaskPattern[QRMaskPattern["PATTERN001"] = 1] = "PATTERN001";
    QRMaskPattern[QRMaskPattern["PATTERN010"] = 2] = "PATTERN010";
    QRMaskPattern[QRMaskPattern["PATTERN011"] = 3] = "PATTERN011";
    QRMaskPattern[QRMaskPattern["PATTERN100"] = 4] = "PATTERN100";
    QRMaskPattern[QRMaskPattern["PATTERN101"] = 5] = "PATTERN101";
    QRMaskPattern[QRMaskPattern["PATTERN110"] = 6] = "PATTERN110";
    QRMaskPattern[QRMaskPattern["PATTERN111"] = 7] = "PATTERN111";
})(QRMaskPattern || (QRMaskPattern = {}));

class QRUtil {
    static getBCHTypeInfo(data) {
        var d = data << 10;
        while (QRUtil.getBCHDigit(d) - QRUtil.getBCHDigit(QRUtil.G15) >= 0) {
            d ^=
                QRUtil.G15 << (QRUtil.getBCHDigit(d) - QRUtil.getBCHDigit(QRUtil.G15));
        }
        return ((data << 10) | d) ^ QRUtil.G15_MASK;
    }
    static getBCHTypeNumber(data) {
        var d = data << 12;
        while (QRUtil.getBCHDigit(d) - QRUtil.getBCHDigit(QRUtil.G18) >= 0) {
            d ^=
                QRUtil.G18 << (QRUtil.getBCHDigit(d) - QRUtil.getBCHDigit(QRUtil.G18));
        }
        return (data << 12) | d;
    }
    static getBCHDigit(data) {
        var digit = 0;
        while (data != 0) {
            digit++;
            data >>>= 1;
        }
        return digit;
    }
    static getPatternPosition(typeNumber) {
        return QRUtil.PATTERN_POSITION_TABLE[typeNumber - 1];
    }
    static getMask(maskPattern, i, j) {
        switch (maskPattern) {
            case QRMaskPattern.PATTERN000:
                return (i + j) % 2 == 0;
            case QRMaskPattern.PATTERN001:
                return i % 2 == 0;
            case QRMaskPattern.PATTERN010:
                return j % 3 == 0;
            case QRMaskPattern.PATTERN011:
                return (i + j) % 3 == 0;
            case QRMaskPattern.PATTERN100:
                return (Math.floor(i / 2) + Math.floor(j / 3)) % 2 == 0;
            case QRMaskPattern.PATTERN101:
                return ((i * j) % 2) + ((i * j) % 3) == 0;
            case QRMaskPattern.PATTERN110:
                return (((i * j) % 2) + ((i * j) % 3)) % 2 == 0;
            case QRMaskPattern.PATTERN111:
                return (((i * j) % 3) + ((i + j) % 2)) % 2 == 0;
            default:
                throw new Error('bad maskPattern:' + maskPattern);
        }
    }
    static getErrorCorrectPolynomial(errorCorrectLength) {
        var a = new QRPolynomial([1], 0);
        for (var i = 0; i < errorCorrectLength; i++) {
            a = a.multiply(new QRPolynomial([1, QRMath.gexp(i)], 0));
        }
        return a;
    }
    static getLengthInBits(mode, type) {
        if (1 <= type && type < 10) {
            // 1 - 9
            switch (mode) {
                case QRMode.MODE_NUMBER:
                    return 10;
                case QRMode.MODE_ALPHA_NUM:
                    return 9;
                case QRMode.MODE_8BIT_BYTE:
                    return 8;
                case QRMode.MODE_KANJI:
                    return 8;
                default:
                    throw new Error('mode:' + mode);
            }
        }
        else if (type < 27) {
            // 10 - 26
            switch (mode) {
                case QRMode.MODE_NUMBER:
                    return 12;
                case QRMode.MODE_ALPHA_NUM:
                    return 11;
                case QRMode.MODE_8BIT_BYTE:
                    return 16;
                case QRMode.MODE_KANJI:
                    return 10;
                default:
                    throw new Error('mode:' + mode);
            }
        }
        else if (type < 41) {
            // 27 - 40
            switch (mode) {
                case QRMode.MODE_NUMBER:
                    return 14;
                case QRMode.MODE_ALPHA_NUM:
                    return 13;
                case QRMode.MODE_8BIT_BYTE:
                    return 16;
                case QRMode.MODE_KANJI:
                    return 12;
                default:
                    throw new Error('mode:' + mode);
            }
        }
        else {
            throw new Error('type:' + type);
        }
    }
    static getLostPoint(qrCode) {
        var moduleCount = qrCode.getModuleCount();
        var lostPoint = 0;
        // LEVEL1
        for (var row = 0; row < moduleCount; row++) {
            for (var col = 0; col < moduleCount; col++) {
                var sameCount = 0;
                var dark = qrCode.isDark(row, col);
                for (var r = -1; r <= 1; r++) {
                    if (row + r < 0 || moduleCount <= row + r) {
                        continue;
                    }
                    for (var c = -1; c <= 1; c++) {
                        if (col + c < 0 || moduleCount <= col + c) {
                            continue;
                        }
                        if (r == 0 && c == 0) {
                            continue;
                        }
                        if (dark == qrCode.isDark(row + r, col + c)) {
                            sameCount++;
                        }
                    }
                }
                if (sameCount > 5) {
                    lostPoint += 3 + sameCount - 5;
                }
            }
        }
        // LEVEL2
        for (var row = 0; row < moduleCount - 1; row++) {
            for (var col = 0; col < moduleCount - 1; col++) {
                var count = 0;
                if (qrCode.isDark(row, col))
                    count++;
                if (qrCode.isDark(row + 1, col))
                    count++;
                if (qrCode.isDark(row, col + 1))
                    count++;
                if (qrCode.isDark(row + 1, col + 1))
                    count++;
                if (count == 0 || count == 4) {
                    lostPoint += 3;
                }
            }
        }
        // LEVEL3
        for (var row = 0; row < moduleCount; row++) {
            for (var col = 0; col < moduleCount - 6; col++) {
                if (qrCode.isDark(row, col) &&
                    !qrCode.isDark(row, col + 1) &&
                    qrCode.isDark(row, col + 2) &&
                    qrCode.isDark(row, col + 3) &&
                    qrCode.isDark(row, col + 4) &&
                    !qrCode.isDark(row, col + 5) &&
                    qrCode.isDark(row, col + 6)) {
                    lostPoint += 40;
                }
            }
        }
        for (var col = 0; col < moduleCount; col++) {
            for (var row = 0; row < moduleCount - 6; row++) {
                if (qrCode.isDark(row, col) &&
                    !qrCode.isDark(row + 1, col) &&
                    qrCode.isDark(row + 2, col) &&
                    qrCode.isDark(row + 3, col) &&
                    qrCode.isDark(row + 4, col) &&
                    !qrCode.isDark(row + 5, col) &&
                    qrCode.isDark(row + 6, col)) {
                    lostPoint += 40;
                }
            }
        }
        // LEVEL4
        var darkCount = 0;
        for (var col = 0; col < moduleCount; col++) {
            for (var row = 0; row < moduleCount; row++) {
                if (qrCode.isDark(row, col)) {
                    darkCount++;
                }
            }
        }
        var ratio = Math.abs((100 * darkCount) / moduleCount / moduleCount - 50) / 5;
        lostPoint += ratio * 10;
        return lostPoint;
    }
}
QRUtil.PATTERN_POSITION_TABLE = [
    [],
    [6, 18],
    [6, 22],
    [6, 26],
    [6, 30],
    [6, 34],
    [6, 22, 38],
    [6, 24, 42],
    [6, 26, 46],
    [6, 28, 50],
    [6, 30, 54],
    [6, 32, 58],
    [6, 34, 62],
    [6, 26, 46, 66],
    [6, 26, 48, 70],
    [6, 26, 50, 74],
    [6, 30, 54, 78],
    [6, 30, 56, 82],
    [6, 30, 58, 86],
    [6, 34, 62, 90],
    [6, 28, 50, 72, 94],
    [6, 26, 50, 74, 98],
    [6, 30, 54, 78, 102],
    [6, 28, 54, 80, 106],
    [6, 32, 58, 84, 110],
    [6, 30, 58, 86, 114],
    [6, 34, 62, 90, 118],
    [6, 26, 50, 74, 98, 122],
    [6, 30, 54, 78, 102, 126],
    [6, 26, 52, 78, 104, 130],
    [6, 30, 56, 82, 108, 134],
    [6, 34, 60, 86, 112, 138],
    [6, 30, 58, 86, 114, 142],
    [6, 34, 62, 90, 118, 146],
    [6, 30, 54, 78, 102, 126, 150],
    [6, 24, 50, 76, 102, 128, 154],
    [6, 28, 54, 80, 106, 132, 158],
    [6, 32, 58, 84, 110, 136, 162],
    [6, 26, 54, 82, 110, 138, 166],
    [6, 30, 58, 86, 114, 142, 170],
];
QRUtil.G15 = (1 << 10) | (1 << 8) | (1 << 5) | (1 << 4) | (1 << 2) | (1 << 1) | (1 << 0);
QRUtil.G18 = (1 << 12) |
    (1 << 11) |
    (1 << 10) |
    (1 << 9) |
    (1 << 8) |
    (1 << 5) |
    (1 << 2) |
    (1 << 0);
QRUtil.G15_MASK = (1 << 14) | (1 << 12) | (1 << 10) | (1 << 4) | (1 << 1);

class QRCode {
    constructor(typeNumber, errorCorrectLevel) {
        this.typeNumber = typeNumber;
        this.errorCorrectLevel = errorCorrectLevel;
        this.modules = null;
        this.moduleCount = 0;
        this.dataCache = null;
        this.dataList = new Array();
    }
    addData(data) {
        var newData = new QR8bitByte(data);
        this.dataList.push(newData);
        this.dataCache = null;
    }
    isDark(row, col) {
        if (row < 0 ||
            this.moduleCount <= row ||
            col < 0 ||
            this.moduleCount <= col) {
            throw new Error(row + ',' + col);
        }
        return this.modules[row][col];
    }
    getModuleCount() {
        return this.moduleCount;
    }
    make() {
        this.makeImpl(false, this.getBestMaskPattern());
    }
    makeImpl(test, maskPattern) {
        this.moduleCount = this.typeNumber * 4 + 17;
        this.modules = new Array(this.moduleCount);
        for (var row = 0; row < this.moduleCount; row++) {
            this.modules[row] = new Array(this.moduleCount);
            for (var col = 0; col < this.moduleCount; col++) {
                this.modules[row][col] = null; //(col + row) % 3;
            }
        }
        this.setupPositionProbePattern(0, 0);
        this.setupPositionProbePattern(this.moduleCount - 7, 0);
        this.setupPositionProbePattern(0, this.moduleCount - 7);
        this.setupPositionAdjustPattern();
        this.setupTimingPattern();
        this.setupTypeInfo(test, maskPattern);
        if (this.typeNumber >= 7) {
            this.setupTypeNumber(test);
        }
        if (this.dataCache == null) {
            this.dataCache = createData(this.typeNumber, this.errorCorrectLevel, this.dataList);
        }
        this.mapData(this.dataCache, maskPattern);
    }
    setupPositionProbePattern(row, col) {
        for (var r = -1; r <= 7; r++) {
            if (row + r <= -1 || this.moduleCount <= row + r)
                continue;
            for (var c = -1; c <= 7; c++) {
                if (col + c <= -1 || this.moduleCount <= col + c)
                    continue;
                if ((0 <= r && r <= 6 && (c == 0 || c == 6)) ||
                    (0 <= c && c <= 6 && (r == 0 || r == 6)) ||
                    (2 <= r && r <= 4 && 2 <= c && c <= 4)) {
                    this.modules[row + r][col + c] = true;
                }
                else {
                    this.modules[row + r][col + c] = false;
                }
            }
        }
    }
    getBestMaskPattern() {
        var minLostPoint = 0;
        var pattern = 0;
        for (var i = 0; i < 8; i++) {
            this.makeImpl(true, i);
            var lostPoint = QRUtil.getLostPoint(this);
            if (i == 0 || minLostPoint > lostPoint) {
                minLostPoint = lostPoint;
                pattern = i;
            }
        }
        return pattern;
    }
    setupTimingPattern() {
        for (var r = 8; r < this.moduleCount - 8; r++) {
            if (this.modules[r][6] != null) {
                continue;
            }
            this.modules[r][6] = r % 2 == 0;
        }
        for (var c = 8; c < this.moduleCount - 8; c++) {
            if (this.modules[6][c] != null) {
                continue;
            }
            this.modules[6][c] = c % 2 == 0;
        }
    }
    setupPositionAdjustPattern() {
        var pos = QRUtil.getPatternPosition(this.typeNumber);
        for (var i = 0; i < pos.length; i++) {
            for (var j = 0; j < pos.length; j++) {
                var row = pos[i];
                var col = pos[j];
                if (this.modules[row][col] != null) {
                    continue;
                }
                for (var r = -2; r <= 2; r++) {
                    for (var c = -2; c <= 2; c++) {
                        if (r == -2 || r == 2 || c == -2 || c == 2 || (r == 0 && c == 0)) {
                            this.modules[row + r][col + c] = true;
                        }
                        else {
                            this.modules[row + r][col + c] = false;
                        }
                    }
                }
            }
        }
    }
    setupTypeNumber(test) {
        var bits = QRUtil.getBCHTypeNumber(this.typeNumber);
        for (var i = 0; i < 18; i++) {
            var mod = !test && ((bits >> i) & 1) == 1;
            this.modules[Math.floor(i / 3)][(i % 3) + this.moduleCount - 8 - 3] = mod;
        }
        for (var i = 0; i < 18; i++) {
            var mod = !test && ((bits >> i) & 1) == 1;
            this.modules[(i % 3) + this.moduleCount - 8 - 3][Math.floor(i / 3)] = mod;
        }
    }
    setupTypeInfo(test, maskPattern) {
        var data = (this.errorCorrectLevel << 3) | maskPattern;
        var bits = QRUtil.getBCHTypeInfo(data);
        // vertical
        for (var i = 0; i < 15; i++) {
            var mod = !test && ((bits >> i) & 1) == 1;
            if (i < 6) {
                this.modules[i][8] = mod;
            }
            else if (i < 8) {
                this.modules[i + 1][8] = mod;
            }
            else {
                this.modules[this.moduleCount - 15 + i][8] = mod;
            }
        }
        // horizontal
        for (var i = 0; i < 15; i++) {
            var mod = !test && ((bits >> i) & 1) == 1;
            if (i < 8) {
                this.modules[8][this.moduleCount - i - 1] = mod;
            }
            else if (i < 9) {
                this.modules[8][15 - i - 1 + 1] = mod;
            }
            else {
                this.modules[8][15 - i - 1] = mod;
            }
        }
        // fixed module
        this.modules[this.moduleCount - 8][8] = !test;
    }
    mapData(data, maskPattern) {
        var inc = -1;
        var row = this.moduleCount - 1;
        var bitIndex = 7;
        var byteIndex = 0;
        for (var col = this.moduleCount - 1; col > 0; col -= 2) {
            if (col == 6)
                col--;
            while (true) {
                for (var c = 0; c < 2; c++) {
                    if (this.modules[row][col - c] == null) {
                        var dark = false;
                        if (byteIndex < data.length) {
                            dark = ((data[byteIndex] >>> bitIndex) & 1) == 1;
                        }
                        var mask = QRUtil.getMask(maskPattern, row, col - c);
                        if (mask) {
                            dark = !dark;
                        }
                        this.modules[row][col - c] = dark;
                        bitIndex--;
                        if (bitIndex == -1) {
                            byteIndex++;
                            bitIndex = 7;
                        }
                    }
                }
                row += inc;
                if (row < 0 || this.moduleCount <= row) {
                    row -= inc;
                    inc = -inc;
                    break;
                }
            }
        }
    }
}
QRCode.PAD0 = 0xec;
QRCode.PAD1 = 0x11;
function createData(typeNumber, errorCorrectLevel, dataList) {
    var rsBlocks = QRRSBlock.getRSBlocks(typeNumber, errorCorrectLevel);
    var buffer = new QRBitBuffer();
    for (var i = 0; i < dataList.length; i++) {
        var data = dataList[i];
        buffer.put(data.mode, 4);
        buffer.put(data.getLength(), QRUtil.getLengthInBits(data.mode, typeNumber));
        data.write(buffer);
    }
    // calc num max data.
    var totalDataCount = 0;
    for (var i = 0; i < rsBlocks.length; i++) {
        totalDataCount += rsBlocks[i].dataCount;
    }
    if (buffer.getLengthInBits() > totalDataCount * 8) {
        throw new Error('code length overflow. (' +
            buffer.getLengthInBits() +
            '>' +
            totalDataCount * 8 +
            ')');
    }
    // end code
    if (buffer.getLengthInBits() + 4 <= totalDataCount * 8) {
        buffer.put(0, 4);
    }
    // padding
    while (buffer.getLengthInBits() % 8 != 0) {
        buffer.putBit(false);
    }
    // padding
    while (true) {
        if (buffer.getLengthInBits() >= totalDataCount * 8) {
            break;
        }
        buffer.put(QRCode.PAD0, 8);
        if (buffer.getLengthInBits() >= totalDataCount * 8) {
            break;
        }
        buffer.put(QRCode.PAD1, 8);
    }
    return createBytes(buffer, rsBlocks);
}
function createBytes(buffer, rsBlocks) {
    var offset = 0;
    var maxDcCount = 0;
    var maxEcCount = 0;
    var dcdata = new Array(rsBlocks.length);
    var ecdata = new Array(rsBlocks.length);
    for (var r = 0; r < rsBlocks.length; r++) {
        var dcCount = rsBlocks[r].dataCount;
        var ecCount = rsBlocks[r].totalCount - dcCount;
        maxDcCount = Math.max(maxDcCount, dcCount);
        maxEcCount = Math.max(maxEcCount, ecCount);
        dcdata[r] = new Array(dcCount);
        for (var i = 0; i < dcdata[r].length; i++) {
            dcdata[r][i] = 0xff & buffer.buffer[i + offset];
        }
        offset += dcCount;
        var rsPoly = QRUtil.getErrorCorrectPolynomial(ecCount);
        var rawPoly = new QRPolynomial(dcdata[r], rsPoly.getLength() - 1);
        var modPoly = rawPoly.mod(rsPoly);
        ecdata[r] = new Array(rsPoly.getLength() - 1);
        for (var i = 0; i < ecdata[r].length; i++) {
            var modIndex = i + modPoly.getLength() - ecdata[r].length;
            ecdata[r][i] = modIndex >= 0 ? modPoly.get(modIndex) : 0;
        }
    }
    var totalCodeCount = 0;
    for (var i = 0; i < rsBlocks.length; i++) {
        totalCodeCount += rsBlocks[i].totalCount;
    }
    var data = new Array(totalCodeCount);
    var index = 0;
    for (var i = 0; i < maxDcCount; i++) {
        for (var r = 0; r < rsBlocks.length; r++) {
            if (i < dcdata[r].length) {
                data[index++] = dcdata[r][i];
            }
        }
    }
    for (var i = 0; i < maxEcCount; i++) {
        for (var r = 0; r < rsBlocks.length; r++) {
            if (i < ecdata[r].length) {
                data[index++] = ecdata[r][i];
            }
        }
    }
    return data;
}

function makeQR(data, typeNumber, errorCorrectLevel) {
    const qr = new QRCode(typeNumber, errorCorrectLevel);
    qr.addData(data);
    qr.make();
    const size = qr.getModuleCount();
    const isDark = (row, col) => qr.isDark(row, col);
    return { size, isDark };
}

/**
 * Returns a QR code representation of the provided account address
 * @param address - The account address to generate the QR code for
 */
function generateAccountAddressQRCode(address) {
    const qr = makeQR(address, 5, 0);
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

const ENGLISH_WORDLIST = ["abandon", "ability", "able", "about", "above", "absent", "absorb", "abstract", "absurd", "abuse", "access", "accident", "account", "accuse", "achieve", "acid", "acoustic", "acquire", "across", "act", "action", "actor", "actress", "actual", "adapt", "add", "addict", "address", "adjust", "admit", "adult", "advance", "advice", "aerobic", "affair", "afford", "afraid", "again", "age", "agent", "agree", "ahead", "aim", "air", "airport", "aisle", "alarm", "album", "alcohol", "alert", "alien", "all", "alley", "allow", "almost", "alone", "alpha", "already", "also", "alter", "always", "amateur", "amazing", "among", "amount", "amused", "analyst", "anchor", "ancient", "anger", "angle", "angry", "animal", "ankle", "announce", "annual", "another", "answer", "antenna", "antique", "anxiety", "any", "apart", "apology", "appear", "apple", "approve", "april", "arch", "arctic", "area", "arena", "argue", "arm", "armed", "armor", "army", "around", "arrange", "arrest", "arrive", "arrow", "art", "artefact", "artist", "artwork", "ask", "aspect", "assault", "asset", "assist", "assume", "asthma", "athlete", "atom", "attack", "attend", "attitude", "attract", "auction", "audit", "august", "aunt", "author", "auto", "autumn", "average", "avocado", "avoid", "awake", "aware", "away", "awesome", "awful", "awkward", "axis", "baby", "bachelor", "bacon", "badge", "bag", "balance", "balcony", "ball", "bamboo", "banana", "banner", "bar", "barely", "bargain", "barrel", "base", "basic", "basket", "battle", "beach", "bean", "beauty", "because", "become", "beef", "before", "begin", "behave", "behind", "believe", "below", "belt", "bench", "benefit", "best", "betray", "better", "between", "beyond", "bicycle", "bid", "bike", "bind", "biology", "bird", "birth", "bitter", "black", "blade", "blame", "blanket", "blast", "bleak", "bless", "blind", "blood", "blossom", "blouse", "blue", "blur", "blush", "board", "boat", "body", "boil", "bomb", "bone", "bonus", "book", "boost", "border", "boring", "borrow", "boss", "bottom", "bounce", "box", "boy", "bracket", "brain", "brand", "brass", "brave", "bread", "breeze", "brick", "bridge", "brief", "bright", "bring", "brisk", "broccoli", "broken", "bronze", "broom", "brother", "brown", "brush", "bubble", "buddy", "budget", "buffalo", "build", "bulb", "bulk", "bullet", "bundle", "bunker", "burden", "burger", "burst", "bus", "business", "busy", "butter", "buyer", "buzz", "cabbage", "cabin", "cable", "cactus", "cage", "cake", "call", "calm", "camera", "camp", "can", "canal", "cancel", "candy", "cannon", "canoe", "canvas", "canyon", "capable", "capital", "captain", "car", "carbon", "card", "cargo", "carpet", "carry", "cart", "case", "cash", "casino", "castle", "casual", "cat", "catalog", "catch", "category", "cattle", "caught", "cause", "caution", "cave", "ceiling", "celery", "cement", "census", "century", "cereal", "certain", "chair", "chalk", "champion", "change", "chaos", "chapter", "charge", "chase", "chat", "cheap", "check", "cheese", "chef", "cherry", "chest", "chicken", "chief", "child", "chimney", "choice", "choose", "chronic", "chuckle", "chunk", "churn", "cigar", "cinnamon", "circle", "citizen", "city", "civil", "claim", "clap", "clarify", "claw", "clay", "clean", "clerk", "clever", "click", "client", "cliff", "climb", "clinic", "clip", "clock", "clog", "close", "cloth", "cloud", "clown", "club", "clump", "cluster", "clutch", "coach", "coast", "coconut", "code", "coffee", "coil", "coin", "collect", "color", "column", "combine", "come", "comfort", "comic", "common", "company", "concert", "conduct", "confirm", "congress", "connect", "consider", "control", "convince", "cook", "cool", "copper", "copy", "coral", "core", "corn", "correct", "cost", "cotton", "couch", "country", "couple", "course", "cousin", "cover", "coyote", "crack", "cradle", "craft", "cram", "crane", "crash", "crater", "crawl", "crazy", "cream", "credit", "creek", "crew", "cricket", "crime", "crisp", "critic", "crop", "cross", "crouch", "crowd", "crucial", "cruel", "cruise", "crumble", "crunch", "crush", "cry", "crystal", "cube", "culture", "cup", "cupboard", "curious", "current", "curtain", "curve", "cushion", "custom", "cute", "cycle", "dad", "damage", "damp", "dance", "danger", "daring", "dash", "daughter", "dawn", "day", "deal", "debate", "debris", "decade", "december", "decide", "decline", "decorate", "decrease", "deer", "defense", "define", "defy", "degree", "delay", "deliver", "demand", "demise", "denial", "dentist", "deny", "depart", "depend", "deposit", "depth", "deputy", "derive", "describe", "desert", "design", "desk", "despair", "destroy", "detail", "detect", "develop", "device", "devote", "diagram", "dial", "diamond", "diary", "dice", "diesel", "diet", "differ", "digital", "dignity", "dilemma", "dinner", "dinosaur", "direct", "dirt", "disagree", "discover", "disease", "dish", "dismiss", "disorder", "display", "distance", "divert", "divide", "divorce", "dizzy", "doctor", "document", "dog", "doll", "dolphin", "domain", "donate", "donkey", "donor", "door", "dose", "double", "dove", "draft", "dragon", "drama", "drastic", "draw", "dream", "dress", "drift", "drill", "drink", "drip", "drive", "drop", "drum", "dry", "duck", "dumb", "dune", "during", "dust", "dutch", "duty", "dwarf", "dynamic", "eager", "eagle", "early", "earn", "earth", "easily", "east", "easy", "echo", "ecology", "economy", "edge", "edit", "educate", "effort", "egg", "eight", "either", "elbow", "elder", "electric", "elegant", "element", "elephant", "elevator", "elite", "else", "embark", "embody", "embrace", "emerge", "emotion", "employ", "empower", "empty", "enable", "enact", "end", "endless", "endorse", "enemy", "energy", "enforce", "engage", "engine", "enhance", "enjoy", "enlist", "enough", "enrich", "enroll", "ensure", "enter", "entire", "entry", "envelope", "episode", "equal", "equip", "era", "erase", "erode", "erosion", "error", "erupt", "escape", "essay", "essence", "estate", "eternal", "ethics", "evidence", "evil", "evoke", "evolve", "exact", "example", "excess", "exchange", "excite", "exclude", "excuse", "execute", "exercise", "exhaust", "exhibit", "exile", "exist", "exit", "exotic", "expand", "expect", "expire", "explain", "expose", "express", "extend", "extra", "eye", "eyebrow", "fabric", "face", "faculty", "fade", "faint", "faith", "fall", "false", "fame", "family", "famous", "fan", "fancy", "fantasy", "farm", "fashion", "fat", "fatal", "father", "fatigue", "fault", "favorite", "feature", "february", "federal", "fee", "feed", "feel", "female", "fence", "festival", "fetch", "fever", "few", "fiber", "fiction", "field", "figure", "file", "film", "filter", "final", "find", "fine", "finger", "finish", "fire", "firm", "first", "fiscal", "fish", "fit", "fitness", "fix", "flag", "flame", "flash", "flat", "flavor", "flee", "flight", "flip", "float", "flock", "floor", "flower", "fluid", "flush", "fly", "foam", "focus", "fog", "foil", "fold", "follow", "food", "foot", "force", "forest", "forget", "fork", "fortune", "forum", "forward", "fossil", "foster", "found", "fox", "fragile", "frame", "frequent", "fresh", "friend", "fringe", "frog", "front", "frost", "frown", "frozen", "fruit", "fuel", "fun", "funny", "furnace", "fury", "future", "gadget", "gain", "galaxy", "gallery", "game", "gap", "garage", "garbage", "garden", "garlic", "garment", "gas", "gasp", "gate", "gather", "gauge", "gaze", "general", "genius", "genre", "gentle", "genuine", "gesture", "ghost", "giant", "gift", "giggle", "ginger", "giraffe", "girl", "give", "glad", "glance", "glare", "glass", "glide", "glimpse", "globe", "gloom", "glory", "glove", "glow", "glue", "goat", "goddess", "gold", "good", "goose", "gorilla", "gospel", "gossip", "govern", "gown", "grab", "grace", "grain", "grant", "grape", "grass", "gravity", "great", "green", "grid", "grief", "grit", "grocery", "group", "grow", "grunt", "guard", "guess", "guide", "guilt", "guitar", "gun", "gym", "habit", "hair", "half", "hammer", "hamster", "hand", "happy", "harbor", "hard", "harsh", "harvest", "hat", "have", "hawk", "hazard", "head", "health", "heart", "heavy", "hedgehog", "height", "hello", "helmet", "help", "hen", "hero", "hidden", "high", "hill", "hint", "hip", "hire", "history", "hobby", "hockey", "hold", "hole", "holiday", "hollow", "home", "honey", "hood", "hope", "horn", "horror", "horse", "hospital", "host", "hotel", "hour", "hover", "hub", "huge", "human", "humble", "humor", "hundred", "hungry", "hunt", "hurdle", "hurry", "hurt", "husband", "hybrid", "ice", "icon", "idea", "identify", "idle", "ignore", "ill", "illegal", "illness", "image", "imitate", "immense", "immune", "impact", "impose", "improve", "impulse", "inch", "include", "income", "increase", "index", "indicate", "indoor", "industry", "infant", "inflict", "inform", "inhale", "inherit", "initial", "inject", "injury", "inmate", "inner", "innocent", "input", "inquiry", "insane", "insect", "inside", "inspire", "install", "intact", "interest", "into", "invest", "invite", "involve", "iron", "island", "isolate", "issue", "item", "ivory", "jacket", "jaguar", "jar", "jazz", "jealous", "jeans", "jelly", "jewel", "job", "join", "joke", "journey", "joy", "judge", "juice", "jump", "jungle", "junior", "junk", "just", "kangaroo", "keen", "keep", "ketchup", "key", "kick", "kid", "kidney", "kind", "kingdom", "kiss", "kit", "kitchen", "kite", "kitten", "kiwi", "knee", "knife", "knock", "know", "lab", "label", "labor", "ladder", "lady", "lake", "lamp", "language", "laptop", "large", "later", "latin", "laugh", "laundry", "lava", "law", "lawn", "lawsuit", "layer", "lazy", "leader", "leaf", "learn", "leave", "lecture", "left", "leg", "legal", "legend", "leisure", "lemon", "lend", "length", "lens", "leopard", "lesson", "letter", "level", "liar", "liberty", "library", "license", "life", "lift", "light", "like", "limb", "limit", "link", "lion", "liquid", "list", "little", "live", "lizard", "load", "loan", "lobster", "local", "lock", "logic", "lonely", "long", "loop", "lottery", "loud", "lounge", "love", "loyal", "lucky", "luggage", "lumber", "lunar", "lunch", "luxury", "lyrics", "machine", "mad", "magic", "magnet", "maid", "mail", "main", "major", "make", "mammal", "man", "manage", "mandate", "mango", "mansion", "manual", "maple", "marble", "march", "margin", "marine", "market", "marriage", "mask", "mass", "master", "match", "material", "math", "matrix", "matter", "maximum", "maze", "meadow", "mean", "measure", "meat", "mechanic", "medal", "media", "melody", "melt", "member", "memory", "mention", "menu", "mercy", "merge", "merit", "merry", "mesh", "message", "metal", "method", "middle", "midnight", "milk", "million", "mimic", "mind", "minimum", "minor", "minute", "miracle", "mirror", "misery", "miss", "mistake", "mix", "mixed", "mixture", "mobile", "model", "modify", "mom", "moment", "monitor", "monkey", "monster", "month", "moon", "moral", "more", "morning", "mosquito", "mother", "motion", "motor", "mountain", "mouse", "move", "movie", "much", "muffin", "mule", "multiply", "muscle", "museum", "mushroom", "music", "must", "mutual", "myself", "mystery", "myth", "naive", "name", "napkin", "narrow", "nasty", "nation", "nature", "near", "neck", "need", "negative", "neglect", "neither", "nephew", "nerve", "nest", "net", "network", "neutral", "never", "news", "next", "nice", "night", "noble", "noise", "nominee", "noodle", "normal", "north", "nose", "notable", "note", "nothing", "notice", "novel", "now", "nuclear", "number", "nurse", "nut", "oak", "obey", "object", "oblige", "obscure", "observe", "obtain", "obvious", "occur", "ocean", "october", "odor", "off", "offer", "office", "often", "oil", "okay", "old", "olive", "olympic", "omit", "once", "one", "onion", "online", "only", "open", "opera", "opinion", "oppose", "option", "orange", "orbit", "orchard", "order", "ordinary", "organ", "orient", "original", "orphan", "ostrich", "other", "outdoor", "outer", "output", "outside", "oval", "oven", "over", "own", "owner", "oxygen", "oyster", "ozone", "pact", "paddle", "page", "pair", "palace", "palm", "panda", "panel", "panic", "panther", "paper", "parade", "parent", "park", "parrot", "party", "pass", "patch", "path", "patient", "patrol", "pattern", "pause", "pave", "payment", "peace", "peanut", "pear", "peasant", "pelican", "pen", "penalty", "pencil", "people", "pepper", "perfect", "permit", "person", "pet", "phone", "photo", "phrase", "physical", "piano", "picnic", "picture", "piece", "pig", "pigeon", "pill", "pilot", "pink", "pioneer", "pipe", "pistol", "pitch", "pizza", "place", "planet", "plastic", "plate", "play", "please", "pledge", "pluck", "plug", "plunge", "poem", "poet", "point", "polar", "pole", "police", "pond", "pony", "pool", "popular", "portion", "position", "possible", "post", "potato", "pottery", "poverty", "powder", "power", "practice", "praise", "predict", "prefer", "prepare", "present", "pretty", "prevent", "price", "pride", "primary", "print", "priority", "prison", "private", "prize", "problem", "process", "produce", "profit", "program", "project", "promote", "proof", "property", "prosper", "protect", "proud", "provide", "public", "pudding", "pull", "pulp", "pulse", "pumpkin", "punch", "pupil", "puppy", "purchase", "purity", "purpose", "purse", "push", "put", "puzzle", "pyramid", "quality", "quantum", "quarter", "question", "quick", "quit", "quiz", "quote", "rabbit", "raccoon", "race", "rack", "radar", "radio", "rail", "rain", "raise", "rally", "ramp", "ranch", "random", "range", "rapid", "rare", "rate", "rather", "raven", "raw", "razor", "ready", "real", "reason", "rebel", "rebuild", "recall", "receive", "recipe", "record", "recycle", "reduce", "reflect", "reform", "refuse", "region", "regret", "regular", "reject", "relax", "release", "relief", "rely", "remain", "remember", "remind", "remove", "render", "renew", "rent", "reopen", "repair", "repeat", "replace", "report", "require", "rescue", "resemble", "resist", "resource", "response", "result", "retire", "retreat", "return", "reunion", "reveal", "review", "reward", "rhythm", "rib", "ribbon", "rice", "rich", "ride", "ridge", "rifle", "right", "rigid", "ring", "riot", "ripple", "risk", "ritual", "rival", "river", "road", "roast", "robot", "robust", "rocket", "romance", "roof", "rookie", "room", "rose", "rotate", "rough", "round", "route", "royal", "rubber", "rude", "rug", "rule", "run", "runway", "rural", "sad", "saddle", "sadness", "safe", "sail", "salad", "salmon", "salon", "salt", "salute", "same", "sample", "sand", "satisfy", "satoshi", "sauce", "sausage", "save", "say", "scale", "scan", "scare", "scatter", "scene", "scheme", "school", "science", "scissors", "scorpion", "scout", "scrap", "screen", "script", "scrub", "sea", "search", "season", "seat", "second", "secret", "section", "security", "seed", "seek", "segment", "select", "sell", "seminar", "senior", "sense", "sentence", "series", "service", "session", "settle", "setup", "seven", "shadow", "shaft", "shallow", "share", "shed", "shell", "sheriff", "shield", "shift", "shine", "ship", "shiver", "shock", "shoe", "shoot", "shop", "short", "shoulder", "shove", "shrimp", "shrug", "shuffle", "shy", "sibling", "sick", "side", "siege", "sight", "sign", "silent", "silk", "silly", "silver", "similar", "simple", "since", "sing", "siren", "sister", "situate", "six", "size", "skate", "sketch", "ski", "skill", "skin", "skirt", "skull", "slab", "slam", "sleep", "slender", "slice", "slide", "slight", "slim", "slogan", "slot", "slow", "slush", "small", "smart", "smile", "smoke", "smooth", "snack", "snake", "snap", "sniff", "snow", "soap", "soccer", "social", "sock", "soda", "soft", "solar", "soldier", "solid", "solution", "solve", "someone", "song", "soon", "sorry", "sort", "soul", "sound", "soup", "source", "south", "space", "spare", "spatial", "spawn", "speak", "special", "speed", "spell", "spend", "sphere", "spice", "spider", "spike", "spin", "spirit", "split", "spoil", "sponsor", "spoon", "sport", "spot", "spray", "spread", "spring", "spy", "square", "squeeze", "squirrel", "stable", "stadium", "staff", "stage", "stairs", "stamp", "stand", "start", "state", "stay", "steak", "steel", "stem", "step", "stereo", "stick", "still", "sting", "stock", "stomach", "stone", "stool", "story", "stove", "strategy", "street", "strike", "strong", "struggle", "student", "stuff", "stumble", "style", "subject", "submit", "subway", "success", "such", "sudden", "suffer", "sugar", "suggest", "suit", "summer", "sun", "sunny", "sunset", "super", "supply", "supreme", "sure", "surface", "surge", "surprise", "surround", "survey", "suspect", "sustain", "swallow", "swamp", "swap", "swarm", "swear", "sweet", "swift", "swim", "swing", "switch", "sword", "symbol", "symptom", "syrup", "system", "table", "tackle", "tag", "tail", "talent", "talk", "tank", "tape", "target", "task", "taste", "tattoo", "taxi", "teach", "team", "tell", "ten", "tenant", "tennis", "tent", "term", "test", "text", "thank", "that", "theme", "then", "theory", "there", "they", "thing", "this", "thought", "three", "thrive", "throw", "thumb", "thunder", "ticket", "tide", "tiger", "tilt", "timber", "time", "tiny", "tip", "tired", "tissue", "title", "toast", "tobacco", "today", "toddler", "toe", "together", "toilet", "token", "tomato", "tomorrow", "tone", "tongue", "tonight", "tool", "tooth", "top", "topic", "topple", "torch", "tornado", "tortoise", "toss", "total", "tourist", "toward", "tower", "town", "toy", "track", "trade", "traffic", "tragic", "train", "transfer", "trap", "trash", "travel", "tray", "treat", "tree", "trend", "trial", "tribe", "trick", "trigger", "trim", "trip", "trophy", "trouble", "truck", "true", "truly", "trumpet", "trust", "truth", "try", "tube", "tuition", "tumble", "tuna", "tunnel", "turkey", "turn", "turtle", "twelve", "twenty", "twice", "twin", "twist", "two", "type", "typical", "ugly", "umbrella", "unable", "unaware", "uncle", "uncover", "under", "undo", "unfair", "unfold", "unhappy", "uniform", "unique", "unit", "universe", "unknown", "unlock", "until", "unusual", "unveil", "update", "upgrade", "uphold", "upon", "upper", "upset", "urban", "urge", "usage", "use", "used", "useful", "useless", "usual", "utility", "vacant", "vacuum", "vague", "valid", "valley", "valve", "van", "vanish", "vapor", "various", "vast", "vault", "vehicle", "velvet", "vendor", "venture", "venue", "verb", "verify", "version", "very", "vessel", "veteran", "viable", "vibrant", "vicious", "victory", "video", "view", "village", "vintage", "violin", "virtual", "virus", "visa", "visit", "visual", "vital", "vivid", "vocal", "voice", "void", "volcano", "volume", "vote", "voyage", "wage", "wagon", "wait", "walk", "wall", "walnut", "want", "warfare", "warm", "warrior", "wash", "wasp", "waste", "water", "wave", "way", "wealth", "weapon", "wear", "weasel", "weather", "web", "wedding", "weekend", "weird", "welcome", "west", "wet", "whale", "what", "wheat", "wheel", "when", "where", "whip", "whisper", "wide", "width", "wife", "wild", "will", "win", "window", "wine", "wing", "wink", "winner", "winter", "wire", "wisdom", "wise", "wish", "witness", "wolf", "woman", "wonder", "wood", "wool", "word", "work", "world", "worry", "worth", "wrap", "wreck", "wrestle", "wrist", "write", "wrong", "yard", "year", "yellow", "you", "young", "youth", "zebra", "zero", "zone", "zoo"];
/**
 * Indicates if the provided entropy is valid
 * @param entropy - The entropy to validate
 */
function isValidEntropy(entropy) {
    return ((entropy.length >= 16) &&
        (entropy.length <= 32) &&
        (entropy.length % 4 === 0));
}
/**
 * Converts the provided entropy into an equivalent mnemonic
 * @param entropy - The entropy to convert
 */
async function entropyToMnemonic(entropy) {
    if (!isValidEntropy(entropy))
        throw new TypeError(`Invalid entropy '${bytesToHex(entropy)}'`);
    const hashBuffer = new Uint8Array(await crypto.subtle.digest("SHA-256", entropy));
    const entropyBits = bytesToBits(entropy).join("");
    const checksumBits = bytesToBits(hashBuffer).join("").slice(0, (entropy.length * 8) / 32);
    const bits = entropyBits + checksumBits;
    const chunks = bits.match(/(.{1,11})/g);
    const words = chunks.map(binary => {
        const index = parseInt(binary, 2);
        return ENGLISH_WORDLIST[index];
    });
    return words.join(" ");
}
/**
 * Converts the provided mnemonic into it's equivalent entropy
 * @param mnemonic - The mnemonic to convert
 */
async function mnemonicToEntropy(mnemonic) {
    const words = (mnemonic.normalize("NFKD")).split(" ");
    if (words.length % 3 !== 0)
        throw new Error(`Invalid mnemonic '${mnemonic}'`);
    // Convert word indices to 11 bit binary strings
    const bits = words.map((word) => {
        const index = ENGLISH_WORDLIST.indexOf(word);
        if (index === -1)
            throw new Error(`Invalid mnemonic '${mnemonic}'`);
        let str = index.toString(2);
        while (str.length < 11)
            str = "0" + str;
        return str;
    }).join("");
    const dividerIndex = Math.floor(bits.length / 33) * 32;
    const entropyBits = bits.slice(0, dividerIndex);
    const checksumBits = bits.slice(dividerIndex);
    const entropy = new Uint8Array(entropyBits.match(/(.{1,8})/g).map((v) => parseInt(v, 2)));
    if (!isValidEntropy(entropy))
        throw new TypeError(`Invalid entropy '${bytesToHex(entropy)}'`);
    const newChecksum = new Uint8Array(await crypto.subtle.digest("SHA-256", entropy));
    const newChecksumBits = bytesToBits(newChecksum).join("").slice(0, (entropy.length * 8) / 32);
    if (newChecksumBits !== checksumBits)
        throw new Error(`Invalid checksum '${checksumBits}'`);
    return entropy;
}

let API_URL = ``;
/**
 * Returns the hash of provided block
 * @param block - The block to hash
 */
function hashBlock(block) {
    let balanceToPad = BigInt(block.balance).toString(16);
    while (balanceToPad.length < 32) {
        balanceToPad = "0" + balanceToPad;
    }
    const context = blakejs.blake2bInit(32, null);
    blakejs.blake2bUpdate(context, hexToBytes(`0000000000000000000000000000000000000000000000000000000000000006`));
    blakejs.blake2bUpdate(context, getPublicKey(block.account));
    blakejs.blake2bUpdate(context, hexToBytes(block.previous));
    blakejs.blake2bUpdate(context, getPublicKey(block.representative));
    blakejs.blake2bUpdate(context, hexToBytes(balanceToPad));
    blakejs.blake2bUpdate(context, hexToBytes(block.link));
    const hash = blakejs.blake2bFinal(context);
    return hash;
}
/**
 * Generates proof of work for the provided hash (Currently only supports running on the GPU)
 * @param hash - The hash to generate work for
 */
async function generateProofOfWork(hash) {
    const work = await getWorkGPU(hash);
    if (!isWorkValid(hash, work, 0xfffffe00n))
        throw new Error(`Generated work '${bytesToHex(work)}' is invalid`);
    return work;
}
/**
 * Generates a process block
 * @param privateKey - The private key to sign the block
 * @param previousHash - The hash of the previous block
 * @param representative - The representative to link to the block
 * @param hash - The hash to process
 * @param balance - The account balance after the block got processed
 */
async function generateProcessBlock(privateKey, previousHash, representative, hash, balance) {
    const publicKey = getPublicKey(privateKey);
    // Generate proof-of-work for the block
    const work = await generateProofOfWork(previousHash || publicKey);
    // Build the block
    const block = {};
    block.type = "state";
    block.account = getAccountAddress(publicKey);
    block.previous = bytesToHex(previousHash || new Uint8Array(32));
    block.representative = getAccountAddress(representative);
    block.balance = balance.toString(10);
    block.work = bytesToHex(work);
    block.link = bytesToHex(hash);
    block.signature = bytesToHex(signHash(privateKey, hashBlock(block)));
    return block;
}
/**
 * Submits a POST request to a node
 * @param data - The form data to send
 */
function request(data) {
    // Validate API URL
    if (!API_URL)
        throw new Error(`API URL is invalid`);
    // Perform request
    return new Promise((resolve, reject) => {
        const body = JSON.stringify(data);
        fetch(API_URL, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "Content-Length": String(body.length)
            },
            body: body
        }).then(response => {
            const content = response.json();
            resolve(content);
        }).catch(error => {
            reject(error);
        });
    });
}
/**
 * Indicates if the responded json is valid
 * @param json - The json to check
 */
function isValidJSONResponse(json) {
    return json ? !json.hasOwnProperty("error") : false;
}
/**
 * Logs the response error along with the callee of this function
 * @param error - The error message to log
 */
function logResponseError(error) {
    const stack = new Error("").stack.split("\n")[2].replace(/^\s+at\s+(.+?)\s.+/g, "$1");
    const callee = stack.substr(stack.lastIndexOf(".") + 1).trim();
    // eslint-disable-next-line no-console
    console.warn(`API call '${callee}' failed with: '${error}'`);
}
/**
 * Sets the API URL of the node to perform requests with
 */
function setAPIURL(url) {
    // Validate API URL
    if (url.startsWith("https") || url.startsWith("http")) {
        API_URL = url;
    }
    else {
        throw new Error(`Invalid API URL`);
    }
}
/**
 * Returns the info of the provided account
 * @param publicKey - The public key of the account to query for
 */
async function getAccountInfo(publicKey) {
    const accountAddress = getAccountAddress(publicKey);
    const json = await request({
        "action": "account_info",
        "account": accountAddress,
    });
    if (!isValidJSONResponse(json)) {
        logResponseError(json.error);
        return null;
    }
    return parseAccountInfoResponse(json);
}
/**
 * Returns the balance of the provided account
 * @param publicKey - The public key of the account to query for
 */
async function getAccountBalance(publicKey) {
    const accountAddress = getAccountAddress(publicKey);
    const json = await request({
        "action": "accounts_balances",
        "accounts": [accountAddress],
    });
    if (!isValidJSONResponse(json)) {
        logResponseError(json.error);
        return null;
    }
    return parseAccountBalanceResponse(json);
}
/**
 * Returns the representative of the provided account
 * @param publicKey - The public key of the account to query for
 */
async function getAccountRepresentative(publicKey) {
    const accountAddress = getAccountAddress(publicKey);
    const json = await request({
        "action": "account_representative",
        "account": accountAddress,
    });
    if (!isValidJSONResponse(json)) {
        logResponseError(json.error);
        return null;
    }
    return parseAccountRepresentativeResponse(json);
}
/**
 * Returns the history of the provided account
 * @param publicKey - The public key of the account to query for
 * @param count - Optional limit of history items to query
 */
async function getAccountHistory(publicKey, count = -1) {
    const accountAddress = getAccountAddress(publicKey);
    const json = await request({
        "action": "account_history",
        "account": accountAddress,
        "count": count,
        "raw": false
    });
    if (!isValidJSONResponse(json)) {
        logResponseError(json.error);
        return null;
    }
    return parseAccountHistoryResponse(json);
}
/**
 * Returns the pending blocks of the provided account
 * @param publicKey - The public key of the account to query for
 * @param count - Optional limit of pending blocks to query
 */
async function getAccountPending(publicKey, count = -1) {
    const accountAddress = getAccountAddress(publicKey);
    const json = await request({
        "action": "accounts_pending",
        "accounts": [accountAddress],
        "count": count,
        "threshold": 1,
        "source": true,
    });
    if (!isValidJSONResponse(json)) {
        logResponseError(json.error);
        return null;
    }
    return parseAccountPendingResponse(json);
}
/**
 * Open an account that is currently unopened
 * @param privateKey - The private key of the account
 * @param representative - The representative to link to the account
 * @param pendingHash - The pending hash to open with
 * @param pendingAmount - The pending amount to open with
 */
async function openAccount(privateKey, representative, pendingHash, pendingAmount) {
    const previousHash = null;
    const block = await generateProcessBlock(privateKey, previousHash, representative, pendingHash, pendingAmount);
    // Submit block to the blockchain
    const json = await request({
        "action": "process",
        "json_block": "true",
        "subtype": "open",
        "block": block,
    });
    if (!isValidJSONResponse(json)) {
        logResponseError(json.error);
        return null;
    }
    return parseBlockProcessResponse(json);
}
/**
 * Receive a pending deposit for the given account
 * @param privateKey - The private key of the account
 * @param representative - The representative to link to the account
 * @param pendingHash - The pending hash to receive
 * @param pendingAmount - The pending amount to receive
 */
async function receiveAccount(privateKey, representative, pendingHash, pendingAmount) {
    const publicKey = getPublicKey(privateKey);
    const accountHistory = await getAccountHistory(publicKey);
    const accountBalance = await getAccountBalance(publicKey);
    // Open account if it doesn't have history
    if (!accountHistory || accountHistory.history.length == 0) {
        return openAccount(privateKey, representative, pendingHash, pendingAmount);
    }
    const balance = (pendingAmount + accountBalance.balance);
    const previousHash = (await getAccountInfo(publicKey)).frontier;
    const block = await generateProcessBlock(privateKey, previousHash, representative, pendingHash, balance);
    // Submit block to the blockchain
    const json = await request({
        "action": "process",
        "json_block": "true",
        "subtype": "receive",
        "block": block,
    });
    if (!isValidJSONResponse(json)) {
        logResponseError(json.error);
        return null;
    }
    return parseBlockProcessResponse(json);
}
/**
 * Send amount to the given the account
 * @param srcPrivateKey - The private key of the sender account
 * @param dstPublicKey - The public key of the receiver account
 * @param amount - The amount to send
 */
async function sendAccount(srcPrivateKey, dstPublicKey, amount) {
    const srcPublicKey = getPublicKey(srcPrivateKey);
    const srcAccountInfo = await getAccountInfo(srcPublicKey);
    const srcAccountBalance = await getAccountBalance(srcPublicKey);
    const srcAccountRepresentative = await getAccountRepresentative(srcPublicKey);
    const balance = srcAccountBalance.balance - amount;
    if (srcAccountBalance.balance <= 0n || balance < 0n)
        return null;
    const previousHash = srcAccountInfo.frontier;
    const block = await generateProcessBlock(srcPrivateKey, previousHash, srcAccountRepresentative.account, dstPublicKey, balance);
    // Submit block to the blockchain
    const json = await request({
        "action": "process",
        "json_block": "true",
        "subtype": "send",
        "block": block,
    });
    if (!isValidJSONResponse(json)) {
        logResponseError(json.error);
        return null;
    }
    return parseBlockProcessResponse(json);
}

exports.bytesToBits = bytesToBits;
exports.bytesToHex = bytesToHex;
exports.decimalToHex = decimalToHex;
exports.entropyToMnemonic = entropyToMnemonic;
exports.generateAccountAddressQRCode = generateAccountAddressQRCode;
exports.getAccountAddress = getAccountAddress;
exports.getAccountBalance = getAccountBalance;
exports.getAccountHistory = getAccountHistory;
exports.getAccountInfo = getAccountInfo;
exports.getAccountPending = getAccountPending;
exports.getAccountRepresentative = getAccountRepresentative;
exports.getAmountFromRaw = getAmountFromRaw;
exports.getPrivateKey = getPrivateKey;
exports.getPublicKey = getPublicKey;
exports.getRawFromAmount = getRawFromAmount;
exports.getWorkGPU = getWorkGPU;
exports.hexToBytes = hexToBytes;
exports.isSeedValid = isSeedValid;
exports.isWorkValid = isWorkValid;
exports.mnemonicToEntropy = mnemonicToEntropy;
exports.openAccount = openAccount;
exports.receiveAccount = receiveAccount;
exports.sendAccount = sendAccount;
exports.setAPIURL = setAPIURL;
