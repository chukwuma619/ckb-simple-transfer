# View & Transfer Balance

A simple dApp to view and transfer CKB on the Nervos CKB blockchain. See the [tutorial](https://docs.nervos.org/docs/dapp/transfer-ckb) for how it works.

## Run locally

```bash
npm install
npm start
```

Open the URL Parcel prints (usually `http://localhost:1234`).

## Build

```bash
npm run build
```

Output is in `dist/`.

## Environment

- **`NETWORK`** (optional): `devnet` | `testnet` | `mainnet`. Default: `testnet`.
  - For [offckb](https://github.com/nervosnetwork/offckb) devnet, use `NETWORK=devnet` (RPC: `http://localhost:28114`).

## Security

- Never commit or expose your private key. The app no longer ships with a default key; you must enter your own.
- Use a testnet/devnet key for development.
