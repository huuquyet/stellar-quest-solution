/* TODO (1): Fill in all the SDK, account, and keypair setup below this line  */
import {
  Account,
  BASE_FEE,
  Keypair,
  Networks,
  Operation,
  Server,
  TransactionBuilder,
} from 'stellar-sdk';

const questKeypair = Keypair.fromSecret('SECRET_KEY_HERE');

await Promise.all(
  [questKeypair].map(async (kp) => {
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

/* TODO (1): Fill in all the SDK, account, and keypair setup above this line  */
const transaction = new TransactionBuilder(questAccount, {
  fee: BASE_FEE,
  networkPassphrase: Networks.TESTNET,
})
  .addOperation(
    Operation.bumpSequence({
      bumpTo: (parseInt(questAccount.sequence) + 100).toString(),
    })
  )
  .setTimeout(30)
  .build();

transaction.sign(questKeypair);

try {
  const res = await server.submitTransaction(transaction);
  console.log(`Transaction Successful! Hash: ${res.hash}`);

  /* TODO (4-5): Provided the previous transaction was successful, build, sign
   * and submit your second transaction from within the try loop */

  /* TODO (4): Use this line to re-load your account from the server */
  // const bumpedAccount = server.loadAccount(questKeypair.public)

  /* TODO (4): Use this line to manually create your account object */
  // const bumpedAccount = Account(accountId, sequence)
  /* We are adding 99 here (instead of 100) because the `build()` method in
   * the first transaction has already incremented the sequence by one. */
  const bumpedAccount = new Account(
    questKeypair.publicKey(),
    (parseInt(questAccount.sequence) + 99).toString()
  );

  /* TODO (4): Complete this transaction with the operation of your choosing */
  const nextTransaction = new TransactionBuilder(bumpedAccount, {
    fee: BASE_FEE,
    networkPassphrase: Networks.TESTNET,
  })
    .addOperation(
      Operation.manageData({
        name: 'sequence',
        value: 'bumped',
      })
    )
    .setTimeout(30)
    .build();

  /* TODO (5): sign and submit the second transaction to the testnet */
  nextTransaction.sign(questKeypair);

  const nextRes = await server.submitTransaction(nextTransaction);
  console.log(`Transaction Successful! Hash: ${nextRes.hash}`);
} catch (error: any) {
  console.log(`${error}. More details:\n${JSON.stringify(error.response.data.extras, null, 2)}`);
}
