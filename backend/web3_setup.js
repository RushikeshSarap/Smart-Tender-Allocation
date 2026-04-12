const { Web3 } = require('web3');
const crypto = require('crypto');
const contractABI = require('./TenderSystemABI.json');

const web3 = new Web3(process.env.GANACHE_URL || 'http://127.0.0.1:7545');

// Mock contract address for now. User must deploy and set this in production.
const CONTRACT_ADDRESS = process.env.CONTRACT_ADDRESS || "0x1234567890123456789012345678901234567890";
const contract = new web3.eth.Contract(contractABI, CONTRACT_ADDRESS);

// Helper to generate SHA256 hash
const generateBidHash = (bidData) => {
    return crypto.createHash('sha256').update(JSON.stringify(bidData)).digest('hex');
};

const blockchainLogger = {
  storeBidHash: async (bidId, tenderId, bidHash) => {
      try {
          console.log(`[BLOCKCHAIN] Logging bid Hash -> submitBidHash(${bidId}, ${tenderId}, "${bidHash}")`);
          
          const accounts = await web3.eth.getAccounts();
          if (accounts.length > 0 && CONTRACT_ADDRESS !== "0x1234567890123456789012345678901234567890") {
             await contract.methods.submitBidHash(bidId, tenderId, bidHash)
                 .send({ from: accounts[0], gas: 3000000 });
          } else {
             console.log(`[BLOCKCHAIN SKIP] Simulated write because valid CONTRACT_ADDRESS or accounts are missing.`);
          }
          return true;
      } catch (err) {
          console.error(`[BLOCKCHAIN ERROR] Failed to store bid hash: ${err.message}`);
      }
  },
  storeWinner: async (tenderId, winnerBidId, trueCost) => {
      try {
          console.log(`[BLOCKCHAIN] Logging winner -> storeResult(${tenderId}, ${winnerBidId}, ${trueCost})`);
          
          const accounts = await web3.eth.getAccounts();
          if (accounts.length > 0 && CONTRACT_ADDRESS !== "0x1234567890123456789012345678901234567890") {
             await contract.methods.storeResult(tenderId, winnerBidId, Math.round(trueCost))
                 .send({ from: accounts[0], gas: 3000000 });
          } else {
             console.log(`[BLOCKCHAIN SKIP] Simulated write because valid CONTRACT_ADDRESS or accounts are missing.`);
          }
          return true;
      } catch (err) {
          console.error(`[BLOCKCHAIN ERROR] Failed to store winner result: ${err.message}`);
      }
  }
};

module.exports = { web3, generateBidHash, blockchainLogger, contract };
