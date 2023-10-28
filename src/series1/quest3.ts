import {
  Asset,
  Keypair,
  Networks,
  Operation,
  Server,
  TransactionBuilder,
  BASE_FEE,
} from 'stellar-sdk';

/* TODO (2): get your two keypairs ready, don't forget to have them funded */
const questKeypair = Keypair.fromSecret('SECRET_KEY_HERE');
const issuerKeypair = Keypair.random();

await Promise.all(
  [questKeypair, issuerKeypair].map(async (kp) => {
    // Set up the Friendbot URL endpoints.
    const friendbotUrl = `https://friendbot.stellar.org?addr=${kp.publicKey()}`;
    let response = await fetch(friendbotUrl);

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

/* TODO (3): set up your server connection and load up your quest account */
const server = new Server('https://horizon-testnet.stellar.org');
const questAccount = await server.loadAccount(questKeypair.publicKey());

/* TODO (4): Create your asset below. Use any code you like! */
const santaAsset = new Asset /* put your asset information here */(
  'SANTA',
  issuerKeypair.publicKey()
);
const transaction = new TransactionBuilder(questAccount, {
  fee: BASE_FEE,
  networkPassphrase: Networks.TESTNET,
})
  /* TODO (5): build your transaction containing the changeTrust operation */
  .addOperation(
    Operation.changeTrust({
      asset: santaAsset,
      limit: '100',
      source: questKeypair.publicKey(),
    })
  )
  .setTimeout(30)
  .build();

/* TODO (6): Sign and submit your transaction to the network. */
transaction.sign(questKeypair);

try {
  let res = await server.submitTransaction(transaction);
  console.log(`Transaction Successful! Hash: ${res.hash}`);
} catch (error: any) {
  console.log(`${error}. More details:\n${JSON.stringify(error.response.data.extras, null, 2)}`);
}
