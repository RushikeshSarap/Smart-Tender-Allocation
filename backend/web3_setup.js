const { Web3 } = require('web3');
const crypto = require('crypto');
const contractABI = require('./TenderContractABI.json');

const GANACHE_URL = process.env.GANACHE_URL || 'http://127.0.0.1:7545';
const CONTRACT_ADDRESS = process.env.CONTRACT_ADDRESS || '0x1234567890123456789012345678901234567890';
const PLACEHOLDER_ADDRESS = '0x1234567890123456789012345678901234567890';
const PRIVATE_KEY = process.env.PRIVATE_KEY;

const web3 = new Web3(GANACHE_URL);

const isValidPrivateKey = (key) => {
  if (!key || typeof key !== 'string') return false;
  const normalized = key.trim();
  if (!normalized.startsWith('0x')) return false;
  const hex = normalized.slice(2);
  return /^[0-9a-fA-F]{64}$/.test(hex);
};

if (isValidPrivateKey(PRIVATE_KEY)) {
  web3.eth.accounts.wallet.add(PRIVATE_KEY);
} else if (PRIVATE_KEY) {
  console.warn('[WEB3] Invalid PRIVATE_KEY in environment; falling back to node-managed accounts.');
}

const contract = new web3.eth.Contract(contractABI, CONTRACT_ADDRESS);

const getSenderAccount = async () => {
  if (PRIVATE_KEY && web3.eth.accounts.wallet.length > 0) {
    return web3.eth.accounts.wallet[0].address;
  }
  const accounts = await web3.eth.getAccounts();
  return accounts && accounts.length ? accounts[0] : null;
};

const generateBidHash = (bidData) => crypto.createHash('sha256').update(JSON.stringify(bidData)).digest('hex');
const generateResultHash = (resultData) => crypto.createHash('sha256').update(JSON.stringify(resultData)).digest('hex');

const blockchainLogger = {
  storeBidHash: async (tenderId, bidHash) => {
    try {
      console.log(`[BLOCKCHAIN] submitBidHash(${tenderId}, ${bidHash})`);
      if (CONTRACT_ADDRESS === PLACEHOLDER_ADDRESS) {
        console.log('[BLOCKCHAIN SKIP] No valid contract address configured.');
        return null;
      }

      const from = await getSenderAccount();
      if (!from) {
        throw new Error('No blockchain account available for transaction');
      }

      const receipt = await contract.methods.submitBidHash(tenderId, bidHash).send({ from, gas: 3000000 });
      return receipt.transactionHash;
    } catch (err) {
      console.error(`[BLOCKCHAIN ERROR] Failed to store bid hash: ${err.message}`);
      throw err;
    }
  },

  storeResult: async (tenderId, winnerId, trueCost, resultHash) => {
    try {
      console.log(`[BLOCKCHAIN] storeResult(${tenderId}, ${winnerId}, ${trueCost}, ${resultHash})`);
      if (CONTRACT_ADDRESS === PLACEHOLDER_ADDRESS) {
        console.log('[BLOCKCHAIN SKIP] No valid contract address configured.');
        return null;
      }

      const from = await getSenderAccount();
      if (!from) {
        throw new Error('No blockchain account available for transaction');
      }

      const receipt = await contract.methods.storeResult(tenderId, winnerId, Math.round(trueCost), resultHash)
        .send({ from, gas: 3000000 });
      return receipt.transactionHash;
    } catch (err) {
      console.error(`[BLOCKCHAIN ERROR] Failed to store result: ${err.message}`);
      throw err;
    }
  },

  getBidHashes: async (tenderId) => {
    if (CONTRACT_ADDRESS === PLACEHOLDER_ADDRESS) {
      return [];
    }
    const bids = await contract.methods.getBids(tenderId).call();
    return bids.map((b) => ({ bidHash: b.bidHash, timestamp: Number(b.timestamp) }));
  },

  getResult: async (tenderId) => {
    if (CONTRACT_ADDRESS === PLACEHOLDER_ADDRESS) {
      return null;
    }
    const result = await contract.methods.getResult(tenderId).call();
    return {
      tenderId: Number(result.tenderId),
      winnerId: result.winnerId,
      trueCost: Number(result.trueCost),
      resultHash: result.resultHash,
      timestamp: Number(result.timestamp)
    };
  },

  verifyBidIntegrity: async (tenderId, localBidHash) => {
    const bids = await blockchainLogger.getBidHashes(tenderId);
    const match = bids.some((b) => b.bidHash === localBidHash);
    return { match, blockchainBids: bids };
  },

  verifyResultIntegrity: async (tenderId, localResultHash) => {
    const result = await blockchainLogger.getResult(tenderId);
    const match = result ? result.resultHash === localResultHash : false;
    return { match, blockchainResult: result };
  }
};

module.exports = {
  web3,
  generateBidHash,
  generateResultHash,
  blockchainLogger,
  contract
};
