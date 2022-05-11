# banotils

This repository contains several utils to work with the cryptocurrency [Banano](https://banano.cc/) inside the Browser and Node.

### Demo:
 - [Browser Wallet](https://maierfelix.github.io/banotils/example/wallet.html)
 - [Vanity Address Generator](https://maierfelix.github.io/banotils/example/vanity-address.html)

### Documentation:
The documentation is auto-generated and can be found [here](https://maierfelix.github.io/banotils/docs).

### Installation:
Package installation:
````
npm install banotils
````
Browser installation:
````html
<script src="https://unpkg.com/banotils/dist/index.iife.min.js"></script>
````

### Features:
 - RPC-based requests
 - Wallet generation (Seed, Address, Private and Public keys)
 - Mnemonic generation (BIP39)
 - QR code generation
 - Receiving and sending BAN
 - Several methods for querying data (Account balance, history etc.)
 - Proof-of-Work generation (CPU, GPU or NODE based)
 - AES PBKDF2 encryption/decryption

### Browser Example:
````html
<script src="https://unpkg.com/banotils/dist/index.iife.min.js"></script>

<script>
(async() => {

  // Set API endpoint
  await banotils.setAPIURL(`https://kaliumapi.appditto.com/api`);

  // Generate random wallet
  const walletSeed = crypto.getRandomValues(new Uint8Array(32));
  const walletPrivateKey = banotils.getPrivateKey(walletSeed);
  const walletPublicKey = banotils.getPublicKey(walletPrivateKey);
  const walletAddress = banotils.getAccountAddress(walletPublicKey);

  // Print wallet information
  console.log("Seed:", banotils.bytesToHex(walletSeed));
  console.log("Address:", walletAddress);
  console.log("Private key:", banotils.bytesToHex(walletPrivateKey));
  console.log("Public key:", banotils.bytesToHex(walletPublicKey));

})();
</script>
````

### Node Example:
````js
const ban = require("banotils");
const crypto = require("crypto").webcrypto;

(async () => {

  // Set API endpoint
  await banotils.setAPIURL(`https://kaliumapi.appditto.com/api`);

  // Generate random wallet
  const walletSeed = crypto.getRandomValues(new Uint8Array(32));
  const walletPrivateKey = banotils.getPrivateKey(walletSeed);
  const walletPublicKey = banotils.getPublicKey(walletPrivateKey);
  const walletAddress = banotils.getAccountAddress(walletPublicKey);

  // Print wallet information
  console.log("Seed:", banotils.bytesToHex(walletSeed));
  console.log("Address:", walletAddress);
  console.log("Private key:", banotils.bytesToHex(walletPrivateKey));
  console.log("Public key:", banotils.bytesToHex(walletPublicKey));

})();
````

### Inspired by:
 - [bananojs](https://github.com/BananoCoin/bananojs)
 - [bananovault](https://github.com/BananoCoin/bananovault)
 - [bip39](https://github.com/bitcoinjs/bip39)
