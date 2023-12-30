// exports.endpoint = function(request, response) {
//   const tomlData = `VERSION = "0.1.0"
// NETWORK_PASSPHRASE = "Test SDF Network ; September 2015"
// ACCOUNTS = [
//   "REPLACE_WITH_YOUR_QUEST_ACCOUNT_PUBLIC_KEY"
// ]`
//   response.writeHead(200, {
//     'Access-Control-Allow-Origin': '*',
//     'Content-Type': 'text/plain'
//   })
//   response.end(tomlData)
// }

import {
  BASE_FEE,
  Horizon,
  Keypair,
  Networks,
  Operation,
  TransactionBuilder,
} from '@stellar/stellar-sdk';

/* TODO (3): setup your keypair, server, and load your account */
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

const server = new Horizon.Server('https://horizon-testnet.stellar.org');
const questAccount = await server.loadAccount(questKeypair.publicKey());

/* TODO (4): */
const transaction = new TransactionBuilder(questAccount, {
  fee: BASE_FEE,
  networkPassphrase: Networks.TESTNET,
})
  /* add your operation here */
  .addOperation(
    Operation.setOptions({
      homeDomain: 'ty1ejmglvxfu.runkit.sh' /* replace runkit link here */,
    })
  )
  .setTimeout(30)
  .build();

/* TODO (5): sign and submit your transaction to the testnet */
transaction.sign(questKeypair);

try {
  const res = await server.submitTransaction(transaction);
  console.log(`Transaction Successful! Hash: ${res.hash}`);
} catch (error: any) {
  console.log(`${error}. More details:\n${JSON.stringify(error.response.data.extras, null, 2)}`);
}
