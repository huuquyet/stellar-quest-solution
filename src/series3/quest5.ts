/**
# All work is done in stroops (7 decimal places) to ensure correct rounding
# This also lets us work with integers throughout the process
stroop = 10,000,000

# This is the current state of our LP, we've deposited 100 each of XLM and NOODLE
currentXLM = 100 * stroop = 1,000,000,000
currentNOODLE = 100 * stroop = 1,000,000,000

# All LPs on Stellar, are "constant product" LPs. This is designed to keep the
# total value of each asset in relative equilibrium. The value `constantProduct`
# will change with each operation that affects the LP (deposit, withdraw, or
# asset swaps), but the calculations are always based on this formula. This will
# be important in the calculations to come.
constantProduct = currentXLM * currentNoodle = 10,000 XLM (1 * 10^18 in stroops)

# We are buying 1 NOODLE in this path payment which decreases the amount in the LP to 99 NOODLE
receiveNOODLE = 1 * stroop = 10,000,000
newNOODLE = currentNOODLE - receiveNOODLE = 99 * stroop = 990,000,000

# We calculate how much XLM we will need in the pool to maintain the overall value of the LP
newXLM = constantProduct / newNOODLE = 101.0101010 * stroop = 1,010,101,010

# Subtract the XLM that is already in the pool, and we know how much we need to send (before fees)
sendXLM = newXLM - currentXLM = 1.0101010 * stroop = 10,101,010

# The fee calculation can be a bit tricky. We need a 0.3% fee, but perhaps not
# in the way you are expecting. We are NOT finding 0.3% of the `sendXLM` amount.
# Rather, we are using a reverse percentage to find the total amount we must
# send so that our `sendXLM` amount is 99.7% of our total payment. The difference
# is subtle and not always intuitive, so be careful if you're calculating these.
# We also use `ceil()` to simplify rounding, and avoid payments with 0 fee.
feePercent = 0.003
paymentPercent = 1 - feePercent = 0.997

totalSendXLM = ceil(sendXLM / paymentPercent) = ceil(10,131,404,314) / stroop = 1.0131405 XLM
*/

import {
  Asset,
  BASE_FEE,
  Horizon,
  Keypair,
  LiquidityPoolAsset,
  Networks,
  Operation,
  TransactionBuilder,
  getLiquidityPoolId,
} from '@stellar/stellar-sdk';

/* TODO (1): fill in the boilerplate below this line */
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

const server = new Horizon.Server('https://horizon-testnet.stellar.org');
const questAccount = await server.loadAccount(questKeypair.publicKey());

/* TODO (2): create an Asset and a LiquidityPoolAsset, don't forget to grab the LP ID */
const noodleAsset = new Asset('NOODLE', questKeypair.publicKey());

const lpAsset = new LiquidityPoolAsset(Asset.native(), noodleAsset, 30);

const liquidityPoolId = getLiquidityPoolId('constant_product', lpAsset).toString('hex');

const lpDepositTransaction = new TransactionBuilder(questAccount, {
  fee: BASE_FEE,
  networkPassphrase: Networks.TESTNET,
})
  /* TODO (3): create a trustline so you can hold the pool shares */
  .addOperation(
    Operation.changeTrust({
      asset: lpAsset,
    })
  )
  /* TODO (4): deposit reserve assets into your new LP */
  .addOperation(
    Operation.liquidityPoolDeposit({
      liquidityPoolId: liquidityPoolId,
      maxAmountA: '100',
      maxAmountB: '100',
      minPrice: {
        n: 1,
        d: 1,
      },
      maxPrice: {
        n: 1,
        d: 1,
      },
    })
  )
  .setTimeout(30)
  .build();

/* TODO (4): build, sign, and submit this transaction */
lpDepositTransaction.sign(questKeypair);

try {
  const depositRes = await server.submitTransaction(lpDepositTransaction);
  console.log(`LP Deposit Successful! Hash: ${depositRes.hash}`);

  /* TODO (5): create an account and build a transaction that makes a path
   * payment through the LP you've deposited reserves into */
  // First, a bit of getting ready before we can build the transaction
  const tradeKeypair = Keypair.random();
  console.log(tradeKeypair.secret());

  await Promise.all(
    [tradeKeypair].map(async (kp) => {
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

  const tradeAccount = await server.loadAccount(tradeKeypair.publicKey());

  const pathPaymentTransaction = new TransactionBuilder(tradeAccount, {
    fee: BASE_FEE,
    networkPassphrase: Networks.TESTNET,
  })
    .addOperation(
      Operation.changeTrust({
        asset: noodleAsset,
        source: tradeKeypair.publicKey(),
      })
    )
    .addOperation(
      Operation.pathPaymentStrictReceive({
        sendAsset: Asset.native(),
        sendMax: '1000',
        destination: tradeKeypair.publicKey(),
        destAsset: noodleAsset,
        destAmount: '1',
        source: tradeKeypair.publicKey(),
      })
    )
    .setTimeout(30)
    .build();

  /* TODO (6): build, sign, and submit this transaction */
  pathPaymentTransaction.sign(tradeKeypair);

  const paymentRes = await server.submitTransaction(pathPaymentTransaction);
  console.log(`Path Payment Successful! Hash: ${paymentRes.hash}`);

  /* TODO (7): withdraw all your reserves from the LP */
  const lpWithdrawTransaction = new TransactionBuilder(questAccount, {
    fee: BASE_FEE,
    networkPassphrase: Networks.TESTNET,
  })
    .addOperation(
      Operation.liquidityPoolWithdraw({
        liquidityPoolId: liquidityPoolId,
        amount: '100',
        minAmountA: '0',
        minAmountB: '0',
      })
    )
    .setTimeout(30)
    .build();

  /* TODO (8): build, sign, and submit this transaction */
  lpWithdrawTransaction.sign(questKeypair);

  const withdrawRes = await server.submitTransaction(lpWithdrawTransaction);
  console.log(`LP Withdraw Successful! Hash: ${withdrawRes.hash}`);
} catch (error: any) {
  console.log(`${error}. More details:\n${JSON.stringify(error.response.data.extras, null, 2)}`);
}
