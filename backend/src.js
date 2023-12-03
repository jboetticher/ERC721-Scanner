const Web3 = require('web3');
const express = require('express');
const app = express();
const port = 3001;

const provider = "https://goerli.infura.io/v3/8cbcb19cc1b5439e817ec01df53ece85";
const web3Provider = new Web3.providers.HttpProvider(provider);
const web3 = new Web3(web3Provider);
const ERC165Interface = require("./erc165Interface.json");
const ERC165hash = "0x80ac58cd";

/*
 *  Write a REST endpoint which returns an array of Ethereum addresses for all 
 *  ERC721-compliant contracts created within the last 15 minutes.
*/
app.get('/geterc721', async (req, res) => {

  async function getTransactionsFromLast15Minutes() {
    const currentTime = Date.now() / 1000;
    const fifteenMinutesAgo = currentTime - 60 * 15;

    let allTransactions = [];
    let blockNumber = await web3.eth.getBlockNumber();
    let block = await web3.eth.getBlock(blockNumber);
    let blockTime = block.timestamp;

    // Query a new block until it's over 15 minutes ago
    let batch = new web3.BatchRequest();
    while (blockTime >= fifteenMinutesAgo) {

      /**
       * This makes quite a few requests, one for every block. It
       * could be made more efficient. We could:
       * 
       * 1. Add a cache so that we don't have to query the same blocks
       *    every time we call this endpoint. Would require a database?
       * 
       * 2. Change the logic so that we calculate the number of blocks
       *    that 15 minutes have on average, then do a batch requeest 
       *    with those blocks. Then do additional blocks if necessary.
       */

      allTransactions.push(...block.transactions);
      blockNumber -= 1;
      block = await web3.eth.getBlock(blockNumber);
      blockTime = block.timestamp;
    }
    return allTransactions;
  }

  async function getTransactionReceiptsFromContractCreation(allTransactions) {
    let allContractCalls = [];

    let batch = new web3.BatchRequest();

    for (let i in allTransactions) {
      const tx = allTransactions[i];
      batch.add(web3.eth.getTransactionReceipt
        .request(tx, (err, receipt) => {
          if (receipt != null) {
            const isContractCreation = receipt.to == null && receipt.contractAddress != null;
            if (isContractCreation) {
              allContractCalls.push(receipt);
            }
          }
        })
      );
    }

    await batch.execute();

    return allContractCalls;
  }

  async function getAddressesOfERC721Contracts(receipts) {
    let batch = new web3.BatchRequest();
    const results = [];

    for (let i in receipts) {
      let addr = receipts[i].contractAddress;
      const ERC165Contract = new web3.eth.Contract(ERC165Interface.abi, addr);
      const readAcc = await web3.eth.accounts.create();

      /**
       *  EIP-721 requires that ERC-721 implements ERC165.
       *  https://eips.ethereum.org/EIPS/eip-721#specification
       * 
       *  The problem with this implementation is that a contract could "fake"
       *  its ERC721 compliance by simple returning true for input "0x80ac58cd". 
       *  We simply have to trust the contract creator with this solution.
       */
      batch.add(ERC165Contract.methods.supportsInterface(ERC165hash).call.request(
        {
          "from": readAcc.address
        },
        (err, res) => {
          if (res) {
            results.push(addr);
          }
        })
      );
    }

    await batch.execute();
    return results;
  }



  let allTransactions = await getTransactionsFromLast15Minutes();
  let createdContractReceipts = await getTransactionReceiptsFromContractCreation(allTransactions);
  let newERC721Addresses = await getAddressesOfERC721Contracts(createdContractReceipts);

  res.set('Access-Control-Allow-Origin', '*');
  res.status(200).json(newERC721Addresses);
});

/**
 *  Just a test endpoint that takes hardcoded addresses and checks if they're
 *  ERC721. Assumes the Ropsten network.
 *  I was testing my batch request and my ERC165 theory.
 */
app.get('/test165', async (req, res) => {
  const contractAddresses = [
    "0x908c02706b25e99be54ee661f6227793bf14992a",
    "0x908c02706b25e99be54ee661f6227793bf14992a",
    "0x64aC15046f9914d3eF0Ec9C2B17E88B7B630b8a1"
  ];

  var batch = new web3.BatchRequest();
  const readAcc = await web3.eth.accounts.create();

  let results = [];

  for (let i in contractAddresses) {
    let addr = contractAddresses[i];
    const ERC165Contract = new web3.eth.Contract(ERC165Interface.abi, addr);
    batch.add(ERC165Contract.methods.supportsInterface(ERC165hash).call.request(
      {
        "from": readAcc.address
      },
      (err, res) => results.push(res))
    );
  }
  await batch.execute();

  res.json(results);
});

app.listen(port, () => {
  console.log(`listening on port ${port}`)
});