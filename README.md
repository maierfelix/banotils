# banotils

This repository contains several utils to work with the cryptocurrency [Banano](https://banano.cc/) inside the browser.

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

### Inspired by:
 - [bananojs](https://github.com/BananoCoin/bananojs)
 - [bananovault](https://github.com/BananoCoin/bananovault)
 - [bip39](https://github.com/bitcoinjs/bip39)
