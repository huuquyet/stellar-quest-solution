/* TODO (1): import anything you'll need from the stellar-sdk */
import {
  Asset,
  BASE_FEE,
  Horizon,
  Keypair,
  Networks,
  Operation,
  TransactionBuilder,
} from '@stellar/stellar-sdk';

/* TODO (2): setup your quest keypair, fund it using any method you like */
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

/* TODO (2):  set up your server connection and load up your quest account */
const server = new Horizon.Server('https://horizon-testnet.stellar.org');
const questAccount = await server.loadAccount(questKeypair.publicKey());

/* TODO (3): set the asset you will be using to counter your XLM offer */
const usdcAsset = new Asset('USDC', 'GBBD47IF6LWK7P7MDEVSCWR7DPUWV3NY3DTQEVFL4NAT4AQH3ZLLFLA5');

const transaction = new TransactionBuilder(questAccount, {
  fee: BASE_FEE,
  networkPassphrase: Networks.TESTNET,
})
  /* TODO (4-7): add your operations to this transaction. While you could submit
   * as many different buy/sell/passive-sell offers as you want in one transaction,
   * for this quest, you are only required to submit at least one.  */
  .addOperation(
    Operation.changeTrust({
      asset: usdcAsset,
    })
  )
  .addOperation(
    Operation.manageBuyOffer({
      selling: Asset.native(),
      buying: usdcAsset,
      buyAmount: '100',
      price: '10',
      offerId: '0',
      source: questKeypair.publicKey(),
    })
  )
  .addOperation(
    Operation.manageSellOffer({
      selling: Asset.native(),
      buying: usdcAsset,
      amount: '1000',
      price: '0.1',
      offerId: '0',
      source: questKeypair.publicKey(),
    })
  )
  .addOperation(
    Operation.createPassiveSellOffer({
      selling: Asset.native(),
      buying: usdcAsset,
      amount: '1000',
      price: '0.1',
      source: questKeypair.publicKey(),
    })
  )
  .setTimeout(30)
  .build();

/* TODO (8): sign and submit your transaction to the network */
transaction.sign(questKeypair);

try {
  const res = await server.submitTransaction(transaction);
  console.log(`Transaction Successful! Hash: ${res.hash}`);
} catch (error: any) {
  console.log(`${error}. More details:\n${JSON.stringify(error.response.data.extras, null, 2)}`);
}
