import {
  Asset,
  BASE_FEE,
  Keypair,
  Networks,
  Operation,
  Server,
  TransactionBuilder,
} from 'stellar-sdk';

/* TODO (3): setup the necessary keypairs here */
const questKeypair = Keypair.fromSecret('SECRET_KEY_HERE');
const destinationKeypair = Keypair.random();

await Promise.all(
  [questKeypair, destinationKeypair].map(async (kp) => {
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

/* TODO (4): create your server here, and then use it to load your account */
const server = new Server('https://horizon-testnet.stellar.org');
const questAccount = await server.loadAccount(questKeypair.publicKey());

const transaction = new TransactionBuilder(questAccount, {
  fee: BASE_FEE,
  networkPassphrase: Networks.TESTNET,
})
  .addOperation(
    Operation.payment({
      destination: destinationKeypair.publicKey(),
      asset: Asset.native(),
      amount: '100',
    })
  )
  .setTimeout(30)
  .build();
/* TODO (5): include a payment operation and finish building your transaction here */

transaction.sign(questKeypair);
/* TODO (6): sign your transaction here */
try {
  /* TODO (7): submit your transaction here using your server */
  const res = await server.submitTransaction(transaction);
  console.log(`Transaction Successful! Hash: ${res.hash}`);
} catch (error: any) {
  console.log(`${error}. More details:\n${JSON.stringify(error.response.data.extras, null, 2)}`);
}
