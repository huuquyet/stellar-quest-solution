import { BASE_FEE, Keypair, Networks, Operation, Server, TransactionBuilder } from 'stellar-sdk';

/* TODO (1): create your two keypairs and make sure they are both funded */
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

/* TODO (1): create a server and load your account from it */
const server = new Server('https://horizon-testnet.stellar.org');
const questAccount = await server.loadAccount(questKeypair.publicKey());

/* TODO (2): complete your transaction below */
const transaction = new TransactionBuilder(
  /* fill in the transaction basics here */
  questAccount,
  {
    fee: BASE_FEE,
    networkPassphrase: Networks.TESTNET,
  }
)
  .addOperation(
    Operation.accountMerge({
      /* complete the `accountMerge` operation */
      destination: destinationKeypair.publicKey(),
    })
  )
  .setTimeout(30)
  .build();

/* TODO (3): sign your transaction here and submit it to the testnet */
transaction.sign(questKeypair);

try {
  const res = await server.submitTransaction(transaction);
  console.log(`Transaction Successful! Hash: ${res.hash}`);
} catch (error: any) {
  console.log(`${error}. More details:\n${JSON.stringify(error.response.data.extras, null, 2)}`);
}
