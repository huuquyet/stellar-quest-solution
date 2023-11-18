/* TODO (1): set up your boilerplate below this line so you can build your transactions */
import {
  Asset,
  AuthClawbackEnabledFlag,
  type AuthFlag,
  AuthRevocableFlag,
  BASE_FEE,
  Keypair,
  Networks,
  Operation,
  Server,
  TransactionBuilder,
} from 'stellar-sdk';

// don't forget to fund these accounts
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

const server = new Server('https://horizon-testnet.stellar.org');
const questAccount = await server.loadAccount(questKeypair.publicKey());

/* TODO (1): set up your boilerplate above this line so you can build your transactions */

/* TODO (2): create, sign, and submit a transaction to set account-level flags
 * for your Quest Account */
const transaction = new TransactionBuilder(questAccount, {
  fee: BASE_FEE,
  networkPassphrase: Networks.TESTNET,
})
  .addOperation(
    Operation.setOptions({
      setFlags: (AuthRevocableFlag | AuthClawbackEnabledFlag) as AuthFlag,
    })
  )
  .setTimeout(30)
  .build();

transaction.sign(questKeypair);

try {
  let res = await server.submitTransaction(transaction);
  console.log(`Transaction Successful! Hash: ${res.hash}`);

  /* TODO (3): create an asset that will have clawbacks enabled */
  const clawbackAsset = new Asset(
    'CLAWBACK',
    questKeypair.publicKey()
    // assetFlags = {
    //   clawbackEnabled: true
    // }
  );

  /* TODO (3): pay some of our new asset to the destination account. build, sign, and submit */
  const paymentTransaction = new TransactionBuilder(questAccount, {
    fee: BASE_FEE,
    networkPassphrase: Networks.TESTNET,
  })
    .addOperation(
      Operation.changeTrust({
        asset: clawbackAsset,
        source: destinationKeypair.publicKey(),
      })
    )
    .addOperation(
      Operation.payment({
        destination: destinationKeypair.publicKey(),
        asset: clawbackAsset,
        amount: '500',
      })
    )
    .setTimeout(30)
    .build();

  paymentTransaction.sign(questKeypair, destinationKeypair);

  res = await server.submitTransaction(paymentTransaction);
  console.log(`Payment Successful! Hash: ${res.hash}`);

  /* TODO (4): build a transaction to claw back some or all of the custom asset */
  const clawbackTransaction = new TransactionBuilder(questAccount, {
    fee: BASE_FEE,
    networkPassphrase: Networks.TESTNET,
  })
    .addOperation(
      Operation.clawback({
        asset: clawbackAsset,
        amount: '250',
        from: destinationKeypair.publicKey(),
      })
    )
    .setTimeout(30)
    .build();

  /* TODO (5): sign and submit your final transaction */
  clawbackTransaction.sign(questKeypair);

  res = await server.submitTransaction(clawbackTransaction);
  console.log(`Clawback Successful! Hash: ${res.hash}`);
} catch (error: any) {
  console.log(`${error}. More details:\n${JSON.stringify(error.response.data.extras, null, 2)}`);
}
