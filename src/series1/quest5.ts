import {
  /* TODO (1): import anything you'll need from the stellar-sdk */
  Asset,
  BASE_FEE,
  Keypair,
  Networks,
  Operation,
  Server,
  TransactionBuilder,
} from 'stellar-sdk';

/* TODO (2): create and fund all the accounts you'll need */
const questKeypair = Keypair.fromSecret('SECRET_KEY_HERE');
const issuerKeypair = Keypair.random();
const distributorKeypair = Keypair.random();
const destinationKeypair = Keypair.random();

await Promise.all(
  [questKeypair, issuerKeypair, distributorKeypair, destinationKeypair].map(async (kp) => {
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

/* TODO (3): setup the server, account for the transaction, and your custom asset */
const server = new Server('https://horizon-testnet.stellar.org');
const questAccount = await server.loadAccount(questKeypair.publicKey());

const pathAsset = new Asset('PATH', issuerKeypair.publicKey());

/* TODO (4-6): build your transaction here.
 * If you are attempting this quest in only one transaction, you'll need
 * several operations to accomplish it. Think carefully about which operations
 * you'll need, and which source account each operation will require. */
const transaction = new TransactionBuilder(questAccount, {
  fee: BASE_FEE,
  networkPassphrase: Networks.TESTNET,
})
  .addOperation(
    Operation.changeTrust({
      asset: pathAsset,
      source: destinationKeypair.publicKey(),
    })
  )
  .addOperation(
    Operation.changeTrust({
      asset: pathAsset,
      source: distributorKeypair.publicKey(),
    })
  )
  .addOperation(
    Operation.payment({
      destination: distributorKeypair.publicKey(),
      asset: pathAsset,
      amount: '1000000',
      source: issuerKeypair.publicKey(),
    })
  )
  .addOperation(
    Operation.createPassiveSellOffer({
      selling: pathAsset,
      buying: Asset.native(),
      amount: '2000',
      price: '1',
      source: distributorKeypair.publicKey(),
    })
  )
  .addOperation(
    Operation.createPassiveSellOffer({
      selling: Asset.native(),
      buying: pathAsset,
      amount: '2000',
      price: '1',
      source: distributorKeypair.publicKey(),
    })
  )
  .addOperation(
    Operation.pathPaymentStrictSend({
      sendAsset: Asset.native(),
      sendAmount: '1000',
      destination: destinationKeypair.publicKey(),
      destAsset: pathAsset,
      destMin: '1000',
    })
  )
  .addOperation(
    Operation.pathPaymentStrictReceive({
      sendAsset: pathAsset,
      sendMax: '450',
      destination: questKeypair.publicKey(),
      destAsset: Asset.native(),
      destAmount: '450',
      source: destinationKeypair.publicKey(),
    })
  )
  .setTimeout(30)
  .build();

/* TODO (7): sign and submit your transaction to the network */
transaction.sign(questKeypair, issuerKeypair, destinationKeypair, distributorKeypair);

try {
  const res = await server.submitTransaction(transaction);
  console.log(`Transaction Successful! Hash: ${res.hash}`);
} catch (error: any) {
  console.log(`${error}. More details:\n${JSON.stringify(error.response.data.extras, null, 2)}`);
}
