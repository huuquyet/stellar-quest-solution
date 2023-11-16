/* TODO (1): set up your boilerplate below this line so you can build your transactions */
import {
  Asset,
  BASE_FEE,
  Claimant,
  Keypair,
  Networks,
  Operation,
  Server,
  TransactionBuilder,
} from 'stellar-sdk';

const questKeypair = Keypair.fromSecret('SECRET_KEY_HERE');
const claimantKeypair = Keypair.random(); // reminder: save this keypair info for later use

// We will want to record this information so we can claim the balance later
console.log(`Claimant Public Key: ${claimantKeypair.publicKey()}`);
console.log(`Claimant Secret Key: ${claimantKeypair.secret()}`);

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

/*const server = Server({
    protocol: 'https',
    serverHostname: 'horizon.testnet.stellar.org'
  })
  const questAccount = server.load(questKeypair).call()*/
/* TODO (1): set up your boilerplate above this line so you can build your transactions */

/* TODO (2): create your claimant so that it can only claim the balance after five minutes */
// The `claimant` must wait at least 5 minutes before they can claim the balance.
const claimant = new Claimant(
  /* include the destination */
  claimantKeypair.publicKey(),
  /* configure the necessary predicate(s) */
  Claimant.predicateNot(Claimant.predicateBeforeRelativeTime('300'))
);

/* Optional: You can add your quest account as a claimant, too. Uncomment these lines to do so */
// const questClaimant = new Claimant(
//   questKeypair.publicKey(),
//   Claimant.predicateUnconditional()
// )
// The `questClaimant` may claim the balance at any time (as long as it has not yet been claimed)
const questClaimant = new Claimant(questKeypair.publicKey(), Claimant.predicateUnconditional());
/* TODO (3): Fill out the transaction below to create a claimable balance from your Quest Account */
const transaction = new TransactionBuilder(questAccount, {
  fee: BASE_FEE,
  networkPassphrase: Networks.TESTNET,
})
  .addOperation(
    Operation.createClaimableBalance({
      asset: Asset.native(),
      amount: '100',
      claimants: [claimant, questClaimant],
    })
  )
  .setTimeout(30)
  .build();

/* TODO (4): sign and submit the transaction to the testnet */
transaction.sign(questKeypair);

try {
  const res1 = await server.submitTransaction(transaction);
  console.log(`Transaction Successful! Hash: ${res1.hash}`);

  /* TODO (5): use one of the two techniques below to grab your `claimableBalanceId` */

  // option 1 - find it using the horizon server
  // res = await server.load().claimableBalance().forClaimant(claimantPublicKey())
  // claimableBalanceId = res['_embedded'].records.id
  // This assumes the claimant has exactly one claimable balance available.
  // If this is not the case, you may need to parse the `res.records` array.
  const res2 = await server
    .claimableBalances()
    .claimant(claimantKeypair.publicKey())
    .limit(1)
    .call();
  const claimableBalanceId = res2.records[0].id;

  // option 2 - get it from the transaction we built previously
  // claimableBalanceId = await server.claimableBalanceId(transaction).call()
  // Zero (0) here refers to which operation in the transaction contains the
  // `createClaimableBalance` operation.
  // claimableBalanceId = transaction.getClaimableBalance(0)

  console.log(`Claimable Balance ID: ${claimableBalanceId}`);
} catch (error: any) {
  console.log(`${error}. More details:\n${JSON.stringify(error.response.data.extras, null, 2)}`);
}

/* TODO (6): build your next transaction to claim the claimable balance
 * don't forget to wait (at least) 5 minutes beofore claiming */
await Promise.all(
  [claimantKeypair].map(async (kp) => {
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

const claimantAccount = await server.loadAccount(claimantKeypair.publicKey());
const claimTransaction = new TransactionBuilder(claimantAccount, {
  fee: BASE_FEE,
  networkPassphrase: Networks.TESTNET,
})
  .addOperation(
    Operation.claimClaimableBalance({
      balanceId: transaction.getClaimableBalanceId(0),
    })
  )
  .setTimeout(30)
  .build();

/* TODO (7): sign and submit your second transaction to the testnet */
// claimantKeypair.signPayloadDecorated(claimTransaction)
claimTransaction.sign(claimantKeypair);

try {
  const res3 = await server.submitTransaction(claimTransaction);
  console.log(`Balance Successfully Claimed! Hash: ${res3.hash}`);
} catch (error: any) {
  console.log(`${error}. More details:\n${JSON.stringify(error.response.data.extras, null, 2)}`);
}

// claim all unconditional predicates
const questTransaction = new TransactionBuilder(questAccount, {
  fee: BASE_FEE,
  networkPassphrase: Networks.TESTNET,
});

const res4 = await server.claimableBalances().claimant(questKeypair.publicKey()).limit(200).call();
for (const claimableId of res4.records) {
  console.log(`Claimable Balance ID: ${claimableId.id}`);
  questTransaction.addOperation(
    Operation.claimClaimableBalance({
      balanceId: claimableId.id,
    })
  );
}
const questTransaction1 = questTransaction.setTimeout(30).build();

questTransaction1.sign(questKeypair);

try {
  const res5 = await server.submitTransaction(questTransaction1);
  console.log(`Balance Successfully Claimed! Hash: ${res5.hash}`);
} catch (error: any) {
  console.log(`${error}. More details:\n${JSON.stringify(error.response.data.extras, null, 2)}`);
}
