import {
  Asset,
  BASE_FEE,
  Keypair,
  Networks,
  Operation,
  Server,
  TransactionBuilder,
} from 'stellar-sdk';

const questKeypair = Keypair.fromSecret('SECRET_KEY_HERE');
const sponsorKeypair = Keypair.random();

await Promise.all(
  [sponsorKeypair].map(async (kp) => {
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
const sponsorAccount = await server.loadAccount(sponsorKeypair.publicKey());

/* TODO (2-7): complete the transaction below, reflecting your current account
 * state, paying special attention to source accounts for each operation. To
 * successfully complete the quest you may need more/fewer operations. */
const transaction = new TransactionBuilder(sponsorAccount, {
  fee: BASE_FEE,
  networkPassphrase: Networks.TESTNET,
})
  .addOperation(
    Operation.beginSponsoringFutureReserves({
      sponsoredId: questKeypair.publicKey(),
    })
  )
  .addOperation(
    Operation.createAccount({
      destination: questKeypair.publicKey(),
      startingBalance: '0',
    })
  )
  .addOperation(
    Operation.endSponsoringFutureReserves({
      source: questKeypair.publicKey(),
    })
  )
  .setTimeout(30)
  .build();

/* const transaction = new TransactionBuilder(sponsorAccount, {
    fee: BASE_FEE,
    networkPassphrase: Networks.TESTNET,
  })
  .addOperation(
    Operation.beginSponsoringFutureReserves({
      sponsoredId: questKeypair.publicKey(),
    })
  )
  .addOperation(
    Operation.revokeAccountSponsorship({
      account: questKeypair.publicKey(),
      source: questKeypair.publicKey(),
    })
  )
  .addOperation(
    Operation.endSponsoringFutureReserves({
      source: questKeypair.publicKey(),
    })
  )
  .addOperation(
    Operation.payment({
      destination: 'GAIH3ULLFQ4DGSECF2AR555KZ4KNDGEKN4AFI4SU2M7B43MGK3QJZNSR',
      asset: Asset.native(),
      amount: '10000',
      source: questKeypair.publicKey(),
    })
  )
  .setTimeout(30)
  .build(); */

/* TODO (8): sign and submit your transaction to the testnet */
transaction.sign(sponsorKeypair, questKeypair);

try {
  const res = await server.submitTransaction(transaction);
  console.log(`Transaction Successful! Hash: ${res.hash}`);
} catch (error: any) {
  console.log(`${error}. More details:\n${JSON.stringify(error.response.data.extras, null, 2)}`);
}
