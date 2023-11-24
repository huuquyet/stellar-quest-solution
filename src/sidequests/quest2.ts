// Include the StellarSDK and some other utilities.

import { readFileSync } from 'node:fs';
import { Blob, NFTStorage } from 'nft.storage';
import {
  Asset,
  BASE_FEE,
  Keypair,
  Networks,
  Operation,
  Server,
  TransactionBuilder,
} from 'stellar-sdk';

// Generate two Keypairs: one for issuing the NFT, and one for receiving it.
const issuerKeypair = Keypair.random();
const receiverKeypair = Keypair.fromSecret('SECRET_KEY_HERE');

// Fund both accounts using Friendbot. We're performing the fetch operation, and ensuring the response comes back "OK".

await Promise.all(
  [issuerKeypair, receiverKeypair].map(async (kp) => {
    // Set up the Friendbot URL endpoints.
    const friendbotUrl = `https://friendbot.stellar.org?addr=${kp.publicKey()}`;
    const response = await fetch(friendbotUrl);

    // // Optional Looking at the responses from fetch.
    // let json = await response.json()
    // console.log(json)

    // Check that the response is OK, and give a confirmation message.
    if (response.ok) {
      console.log(`Account ${kp.publicKey()} successfully funded.`);
    } else {
      console.log(`Something went wrong funding account: ${kp.publicKey()}`);
    }
  })
);

// Create the Asset so we can issue it on the network.
const nftAsset = new Asset('DEMONFTSSQL2', issuerKeypair.publicKey());

// Store the Image and metadata using nft.storage
const NFT_STORAGE_TOKEN = 'your_api_key'; // Get this from https://nft.storage/manage
const IMAGE_PATH = 'assets/nft.jpg';
const client = new NFTStorage({ token: NFT_STORAGE_TOKEN });

const imageCID = await client.storeBlob(new Blob([readFileSync(IMAGE_PATH)]));
console.log(`imageCID: ${imageCID}`);

const metadata = {
  name: 'Very Valuable NFT',
  description: 'This is the most valuable NFT available on any blockchain. Ever.',
  url: `https://nftstorage.link/ipfs/${imageCID}`,
  issuer: nftAsset.getIssuer(),
  code: nftAsset.getCode(),
};
const metadataCID = await client.storeBlob(new Blob([JSON.stringify(metadata)]));
console.log(`metadataCID: ${metadataCID}`);

// Connect to the testnet with the StellarSdk.
const server = new Server('https://horizon-testnet.stellar.org');
const account = await server.loadAccount(issuerKeypair.publicKey());

// Build a transaction that mints the NFT.
const transaction = new TransactionBuilder(account, {
  fee: BASE_FEE,
  networkPassphrase: Networks.TESTNET,
})
  // Add the NFT metadata to the issuer account using a `manageData` operation.
  .addOperation(
    Operation.manageData({
      name: 'ipfshash',
      value: metadataCID,
      source: issuerKeypair.publicKey(),
    })
  )
  // Perform a `changeTrust` operation to create a trustline for the receiver account.
  .addOperation(
    Operation.changeTrust({
      asset: nftAsset,
      limit: '0.0000001',
      source: receiverKeypair.publicKey(),
    })
  )
  // Add a `payment` operation to send the NFT to the receiving account.
  .addOperation(
    Operation.payment({
      destination: receiverKeypair.publicKey(),
      asset: nftAsset,
      amount: '0.0000001',
      source: issuerKeypair.publicKey(),
    })
  )
  // setTimeout is required for a transaction, and it also must be built.
  .setTimeout(30)
  .build();

// Sign the transaction with the necessary keypairs.
transaction.sign(issuerKeypair, receiverKeypair);

try {
  await server.submitTransaction(transaction);
  console.log('The asset has been issued to the receiver');
} catch (error: any) {
  console.log(`${error}. More details: \n${error.response.data}`);
}
