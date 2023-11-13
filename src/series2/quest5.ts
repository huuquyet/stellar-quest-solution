import {
  Asset,
  type AuthFlag,
  AuthRequiredFlag,
  AuthRevocableFlag,
  BASE_FEE,
  Keypair,
  Networks,
  Operation,
  Server,
  TransactionBuilder,
} from 'stellar-sdk';

/* TODO (1): you'll need two funded keypairs for this quest */
const questKeypair = Keypair.fromSecret('SECRET_KEY_HERE');
const issuerKeypair = Keypair.random();

await Promise.all(
  [questKeypair, issuerKeypair].map(async (kp) => {
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

/* TODO (1): create your server, and load the *issuer* account from it */
const server = new Server('https://horizon-testnet.stellar.org');
const issuerAccount = await server.loadAccount(issuerKeypair.publicKey());

/* TODO (2): create your custom asset that we can control authorization for */
const controlledAsset = new Asset('CONTROL', issuerKeypair.publicKey());

/* TODO (3-7): add onto the transaction below to complete your quest. Be mindful
 * of which source account you're using for each operation */
const transaction = new TransactionBuilder(issuerAccount, {
  fee: BASE_FEE,
  networkPassphrase: Networks.TESTNET,
})
  .addOperation(
    Operation.setOptions({
      /* (3) you need an operation to set the flags on the issuer account */
      setFlags: (AuthRequiredFlag | AuthRevocableFlag) as AuthFlag,
    })
  )
  .addOperation(
    Operation.changeTrust({
      /* (4) you need an operation for the quest account to trust the asset */
      asset: controlledAsset,
      source: questKeypair.publicKey(),
    })
  )
  .addOperation(
    Operation.setTrustLineFlags({
      /* (5) you need an operation to authorize the trustline for the quest account */
      trustor: questKeypair.publicKey(),
      asset: controlledAsset,
      flags: {
        authorized: true,
      },
    })
  )
  .addOperation(
    Operation.payment({
      /* (6) you need an operation to send the asset to the quest account */
      destination: questKeypair.publicKey(),
      asset: controlledAsset,
      amount: '100',
    })
  )
  .addOperation(
    Operation.setTrustLineFlags({
      /* (7) you need an operation to revoke the quest account's authorization */
      trustor: questKeypair.publicKey(),
      asset: controlledAsset,
      flags: {
        authorized: false,
      },
    })
  )
  .setTimeout(30)
  .build();

/* TODO (8): sign and submit the transaction to the testnet */
transaction.sign(questKeypair, issuerKeypair);

try {
  const res = await server.submitTransaction(transaction);
  console.log(`Transaction Successful! Hash: ${res.hash}`);
} catch (error: any) {
  console.log(`${error}. More details:\n${JSON.stringify(error.response.data.extras, null, 2)}`);
}
