let crypto: Crypto = null;
if (typeof window !== "undefined") {
  crypto = window.crypto;
} else {
  crypto = require("crypto").webcrypto;
}

export default crypto;
