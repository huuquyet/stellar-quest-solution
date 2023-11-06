import { Keypair, Server, TransactionBuilder, Networks, Operation, BASE_FEE } from 'stellar-sdk';

/* TODO (1): setup your keypair, server, and load your account */
const questKeypair = Keypair.fromSecret('SECRET_KEY_HERE');

await Promise.all(
  [questKeypair].map(async (kp) => {
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

const server = new Server('https://horizon-testnet.stellar.org');
const questAccount = await server.loadAccount(questKeypair.publicKey());

/* TODO (2): build your transaction here, containing a `manageData` operation */
const transaction = new TransactionBuilder(questAccount, {
  fee: BASE_FEE,
  networkPassphrase: Networks.TESTNET,
})
  /* add your `manageData` operation here */
  .addOperation(
    Operation.manageData({
      name: 'Hello',
      value: 'World',
    })
  )
  .addOperation(
    Operation.manageData({
      name: 'Hello',
      value: Buffer.from('Stellar Quest!'),
    })
  )
  .setTimeout(30)
  .build();

const valueFromHorizon = 'U3RlbGxhciBRdWVzdCE=';
const valueAsBuffer = Buffer.from(valueFromHorizon, 'base64');
const asciiText = valueAsBuffer.toString('ascii');
// outputs 'Stellar Quest!'
console.log(asciiText);

/* TODO (3): sign and submit your transaction to the testnet */
transaction.sign(questKeypair);

try {
  const res = await server.submitTransaction(transaction);
  console.log(`Transaction Successful! Hash: ${res.hash}`);
} catch (error: any) {
  console.log(`${error}. More details:\n${JSON.stringify(error.response.data.extras, null, 2)}`);
}
