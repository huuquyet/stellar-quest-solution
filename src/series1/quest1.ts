import { BASE_FEE, Keypair, Networks, Operation, Server, TransactionBuilder } from 'stellar-sdk';

const questKeypair = Keypair.fromSecret('SECRET_KEY_HERE');
/* TODO (2): create a new keypair here to serve as the account to be created */

const newKeypair = Keypair.random();
/* TODO (3): create your server here, and then use it to load your account */

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

// You would need to remove the '-testnet' here, if you were using the Stellar Public network.
const server = new Server('https://horizon-testnet.stellar.org');
const questAccount = await server.loadAccount(questKeypair.publicKey());

const transaction = new TransactionBuilder(questAccount, {
  fee: BASE_FEE,
  networkPassphrase: Networks.TESTNET,
})
  /* TODO (5): Complete your transaction below this line
   * add your `createAccount` operation, set a timeout, and don't forget to build() */
  .addOperation(
    Operation.createAccount({
      destination: newKeypair.publicKey(),
      startingBalance: '1000', // You can make this any amount you want (as long as you have the funds!)
    })
  )
  .setTimeout(30)
  .build();
/* TODO (5): Complete your transaction above this line */

/* TODO (6): sign your transaction here */
transaction.sign(questKeypair);
//console.log(transaction.toXdr())

try {
  /* TODO (7): submit your transaction here using your server */
  const res = await server.submitTransaction(transaction);
  console.log(`Transaction Successful! Hash: ${res.hash}`);
} catch (error: any) {
  console.log(`${error}. More details:\n${JSON.stringify(error.response.data.extras, null, 2)}`);
}
