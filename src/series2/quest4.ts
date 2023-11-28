/* TODO (1): get your boilerplate ready, make sure you questKeypair is funded */
import {
  BASE_FEE,
  /* grab everything you need from the sdk */
  Keypair,
  Networks,
  Operation,
  Server,
  TransactionBuilder,
} from 'stellar-sdk';

/* Tip: if you are building and submitting the two transactions necessary for
 * this quest separately, you'll want to log the public/secret keys for these
 * signers so you can use them to sign a transaction when the time comes. */
const questKeypair = Keypair.fromSecret('SECRET_KEY_HERE');
const secondSigner = Keypair.random();
const thirdSigner = Keypair.random();

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

/* TODO (1): prepare your server and load an account from it */
const server = new Server('https://horizon-testnet.stellar.org');
const questAccount = await server.loadAccount(questKeypair.publicKey());

const transaction = new TransactionBuilder(questAccount, {
  fee: BASE_FEE,
  networkPassphrase: Networks.TESTNET,
})
  /* TODO (2): configure your thresholds and weights with a `setOptions` operation */
  .addOperation(
    Operation.setOptions({
      masterWeight: 1,
      lowThreshold: 5,
      medThreshold: 5,
      highThreshold: 5,
    })
  )
  /* TODO (3): add another `ed25519PublicKey` signer with a weight of 2 */
  .addOperation(
    Operation.setOptions({
      signer: {
        ed25519PublicKey: secondSigner.publicKey(),
        weight: 2,
      },
    })
  )
  /* TODO (3): add one more `ed25519PublicKey` signer with the necessary weight */
  .addOperation(
    Operation.setOptions({
      signer: {
        ed25519PublicKey: thirdSigner.publicKey(),
        weight: 2,
      },
    })
  )
  .setTimeout(30)
  .build();

/* TODO (4): sign and submit your transaction to the testnet */
transaction.sign(questKeypair);

try {
  const res = await server.submitTransaction(transaction);
  console.log(`Transaction Successful! Hash: ${res.hash}`);
  /* Tip: If you want to immediately submit this second transaction, right here
   * would be an excellent place to build, sign, and submit that transaction */
  const nextTransaction = new TransactionBuilder(questAccount, {
    fee: BASE_FEE,
    networkPassphrase: Networks.TESTNET,
  })
    .addOperation(
      Operation.bumpSequence({
        bumpTo: '1',
      })
    )
    .setTimeout(30)
    .build();

  nextTransaction.sign(questKeypair, secondSigner, thirdSigner);
  const nextRes = await server.submitTransaction(nextTransaction);
  console.log(`Transaction Successful! Hash: ${nextRes.hash}`);
} catch (error: any) {
  console.log(`${error}. More details:\n${JSON.stringify(error.response.data.extras, null, 2)}`);
}
