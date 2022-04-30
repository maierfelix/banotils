#version 300 es

precision highp float;
precision highp int;

out vec4 fragColor;

uniform uvec4 uWork0;
uniform uvec4 uWork1;

uniform uvec4 uHash0;
uniform uvec4 uHash1;

uniform uint uDifficulty;

#define BLAKE2B_IV32_1 0x6A09E667u

uint v[32] = uint[32](
  0xF2BDC900u, 0x6A09E667u, 0x84CAA73Bu, 0xBB67AE85u,
  0xFE94F82Bu, 0x3C6EF372u, 0x5F1D36F1u, 0xA54FF53Au,
  0xADE682D1u, 0x510E527Fu, 0x2B3E6C1Fu, 0x9B05688Cu,
  0xFB41BD6Bu, 0x1F83D9ABu, 0x137E2179u, 0x5BE0CD19u,
  0xF3BCC908u, 0x6A09E667u, 0x84CAA73Bu, 0xBB67AE85u,
  0xFE94F82Bu, 0x3C6EF372u, 0x5F1D36F1u, 0xA54FF53Au,
  0xADE682F9u, 0x510E527Fu, 0x2B3E6C1Fu, 0x9B05688Cu,
  0x04BE4294u, 0xE07C2654u, 0x137E2179u, 0x5BE0CD19u
);

uint m[32];

const int SIGMA82[192] = int[192](
  0,2,4,6,8,10,12,14,16,18,20,22,24,26,28,30,28,20,8,16,18,30,26,12,2,24,
  0,4,22,14,10,6,22,16,24,0,10,4,30,26,20,28,6,12,14,2,18,8,14,18,6,2,26,
  24,22,28,4,12,10,20,8,0,30,16,18,0,10,14,4,8,20,30,28,2,22,24,12,16,6,
  26,4,24,12,20,0,22,16,6,8,26,14,10,30,28,2,18,24,10,2,30,28,26,8,20,0,
  14,12,6,18,4,16,22,26,22,14,28,24,2,6,18,10,0,30,8,16,12,4,20,12,30,28,
  18,22,6,0,16,24,4,26,14,2,8,20,10,20,4,16,8,14,12,2,10,30,22,18,28,6,24,
  26,0,0,2,4,6,8,10,12,14,16,18,20,22,24,26,28,30,28,20,8,16,18,30,26,12,
  2,24,0,4,22,14,10,6
);

void add_uint64 (int a, uint b0, uint b1) {
  uint o0 = v[a] + b0;
  uint o1 = v[a + 1] + b1;
  if (v[a] > 0xFFFFFFFFu - b0) {
    o1++;
  }
  v[a] = o0;
  v[a + 1] = o1;
}

void add_uint64 (int a, int b) {
  add_uint64(a, v[b], v[b+1]);
}

void B2B_G (int a, int b, int c, int d, int ix, int iy) {
  add_uint64(a, b);
  add_uint64(a, m[ix], m[ix + 1]);

  uint xor0 = v[d] ^ v[a];
  uint xor1 = v[d + 1] ^ v[a + 1];
  v[d] = xor1;
  v[d + 1] = xor0;

  add_uint64(c, d);

  xor0 = v[b] ^ v[c];
  xor1 = v[b + 1] ^ v[c + 1];
  v[b] = (xor0 >> 24) ^ (xor1 << 8);
  v[b + 1] = (xor1 >> 24) ^ (xor0 << 8);

  add_uint64(a, b);
  add_uint64(a, m[iy], m[iy + 1]);

  xor0 = v[d] ^ v[a];
  xor1 = v[d + 1] ^ v[a + 1];
  v[d] = (xor0 >> 16) ^ (xor1 << 16);
  v[d + 1] = (xor1 >> 16) ^ (xor0 << 16);

  add_uint64(c, d);

  xor0 = v[b] ^ v[c];
  xor1 = v[b + 1] ^ v[c + 1];
  v[b] = (xor1 >> 31) ^ (xor0 << 1);
  v[b + 1] = (xor0 >> 31) ^ (xor1 << 1);
}

void main() {
  int i;
  uint uv_x = uint(gl_FragCoord.x);
  uint uv_y = uint(gl_FragCoord.y);
  uint x_pos = uv_x % 256u;
  uint y_pos = uv_y % 256u;
  uint x_index = (uv_x - x_pos) / 256u;
  uint y_index = (uv_y - y_pos) / 256u;

  m[0] = (x_pos ^ (y_pos << 8) ^ ((uWork0.b ^ x_index) << 16) ^ ((uWork0.a ^ y_index) << 24));
  m[1] = (uWork1.r ^ (uWork1.g << 8) ^ (uWork1.b << 16) ^ (uWork1.a << 24));

  m[2] = uHash0[0];
  m[3] = uHash0[1];
  m[4] = uHash0[2];
  m[5] = uHash0[3];
  m[6] = uHash1[0];
  m[7] = uHash1[1];
  m[8] = uHash1[2];
  m[9] = uHash1[3];

  for (i = 0; i < 12; i++) {
    B2B_G(0, 8, 16, 24, SIGMA82[i * 16 + 0], SIGMA82[i * 16 + 1]);
    B2B_G(2, 10, 18, 26, SIGMA82[i * 16 + 2], SIGMA82[i * 16 + 3]);
    B2B_G(4, 12, 20, 28, SIGMA82[i * 16 + 4], SIGMA82[i * 16 + 5]);
    B2B_G(6, 14, 22, 30, SIGMA82[i * 16 + 6], SIGMA82[i * 16 + 7]);
    B2B_G(0, 10, 20, 30, SIGMA82[i * 16 + 8], SIGMA82[i * 16 + 9]);
    B2B_G(2, 12, 22, 24, SIGMA82[i * 16 + 10], SIGMA82[i * 16 + 11]);
    B2B_G(4, 14, 16, 26, SIGMA82[i * 16 + 12], SIGMA82[i * 16 + 13]);
    B2B_G(6, 8, 18, 28, SIGMA82[i * 16 + 14], SIGMA82[i * 16 + 15]);
  }

  if ((BLAKE2B_IV32_1 ^ v[1] ^ v[17]) > uDifficulty) {
    fragColor = vec4(
      float(x_index + 1u)/255.,
      float(y_index + 1u)/255.,
      float(x_pos)/255.,
      float(y_pos)/255.
    );
  }
}
