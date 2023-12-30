// include the StellarSDK
import {
  Asset,
  BASE_FEE,
  Horizon,
  Keypair,
  Networks,
  Operation,
  TransactionBuilder,
} from '@stellar/stellar-sdk';

// Generate two Keypairs: a sender, and a destination.
const senderKeypair = Keypair.random();
const destinationKeypair = Keypair.random();

// Optional: Log the keypair details if you want to save the information for later.
console.log(`Sender Secret Key: ${senderKeypair.secret()}`);
console.log(`Destination Secret Key: ${destinationKeypair.secret()}`);

await Promise.all(
  [senderKeypair, destinationKeypair].map(async (kp) => {
    // Set up the Friendbot URL endpoints.
    const friendbotUrl = `https://friendbot.stellar.org?addr=${kp.publicKey()}`;
    const response = await fetch(friendbotUrl);

    // // Optional Looking at the responses from fetch.
    // const json = await response.json()
    // console.log(json)

    // Check that the response is OK, and give a confirmation message.
    if (response.ok) {
      console.log(`Account ${kp.publicKey()} successfully funded.`);
    } else {
      console.log(`Something went wrong funding account: ${kp.publicKey()}`);
    }
  })
);

// Connect to the testnet with the StellarSdk.
const server = new Horizon.Server('https://horizon-testnet.stellar.org');
const senderAccount = await server.loadAccount(senderKeypair.publicKey());

// Build the inner transaction. This will be the transaction where the payment is actually made.
const innerTransaction = new TransactionBuilder(senderAccount, {
  fee: BASE_FEE,
  networkPassphrase: Networks.TESTNET,
})
  .addOperation(
    Operation.payment({
      destination: destinationKeypair.publicKey(),
      asset: Asset.native(),
      amount: '100',
      source: senderKeypair.publicKey(),
    })
  )
  .setTimeout(30)
  .build();

// Sign the inner transaction using the sender keypair. But, we will not be directly submitting this inner transaction on its own.
innerTransaction.sign(senderKeypair);
console.log('Inner transaction has been signed.');

// Build the fee-bump transaction.  We will use your Quest Account as the "channel account."
// It will be this account that pays the transaction fee and the sequence number.
const questKeypair = Keypair.fromSecret('SECRET_KEY_HERE');

await Promise.all(
  [questKeypair].map(async (kp) => {
    // Set up the Friendbot URL endpoints.
    const friendbotUrl = `https://friendbot.stellar.org?addr=${kp.publicKey()}`;
    const response = await fetch(friendbotUrl);

    // // Optional Looking at the responses from fetch.
    // const json = await response.json()
    // console.log(json)

    // Check that the response is OK, and give a confirmation message.
    if (response.ok) {
      console.log(`Account ${kp.publicKey()} successfully funded.`);
    } else {
      console.log(`Something went wrong funding account: ${kp.publicKey()}`);
    }
  })
);

const feeBumpTransaction = TransactionBuilder.buildFeeBumpTransaction(
  questKeypair,
  BASE_FEE,
  innerTransaction,
  Networks.TESTNET
);

// Sign the fee-bump transaction using the channel account keypair.
feeBumpTransaction.sign(questKeypair);
console.log('Fee-bump transaction has been signed.');

// Finally, submit the fee-bump transaction to the testnet.
try {
  const response = await server.submitTransaction(feeBumpTransaction);
  console.log(
    `Fee-bump transaction was successfully submitted.\nTransaction hash: ${response.hash}`
  );
} catch (error: any) {
  console.log(`${error}. More details:\n${JSON.stringify(error.response.data)}`);
}
