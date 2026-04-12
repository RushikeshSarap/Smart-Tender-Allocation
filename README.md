# Smart Tender Allocation System

A secure, intelligent, and transparent system for government and organizational tender allocation. The project leverages **Blockchain** for immutable record keeping and **AI** for evaluating the true cost of bids, considering mitigating risks and hidden costs.

## Features

- **Role-based Authentication**: Secure portals for Admins and Bidders.
- **Blockchain Security**: All bids and evaluations are irreversibly stored on an EVM-compatible local blockchain (Ganache and Hardhat) to prevent tampering.
- **AI-Driven Evaluation**: Flask-based AI Engine evaluates the "True Cost" of each bid by predicting long-term risks, delays, social costs, and historical performance.
- **Dynamic Dashboards**: Real-time tracking of open tenders, bids, and AI evaluations.

## Project Structure

- `frontend/`: React application containing the Admin and Bidder Dashboards.
- `backend/`: Node.js Express server handling SQL Database operations and routing.
- `ai_engine/`: Flask API and Machine Learning service for predicting real tender costs.
- `blockchain/`: Hardhat local Ethereum environment and Solidity smart contracts.

## Getting Started

### Prerequisites
- Node.js & npm
- Python & pip
- MySQL Server
- Ganache (CLI or GUI)

### Setup Instructions

1. **Database Setup**
   - Import the `backend/init.sql` schema into your MySQL server.
   - Create a `.env` file in the `backend/` folder using the sample below.
   - Update DB credentials and the Ganache contract address.

   Example `backend/.env`:
   ```env
   DB_HOST=localhost
   DB_USER=root
   DB_PASSWORD=your_mysql_password
   DB_NAME=smart_tender_db
   PORT=3000
   GANACHE_URL=http://127.0.0.1:7545
   CONTRACT_ADDRESS=0xYourDeployedContractAddress
   PRIVATE_KEY=0xYourGanacheAccountPrivateKey
   AI_ENGINE_URL=http://localhost:5000
   ```

2. **Backend Server**
   ```bash
   cd backend
   npm install
   npm start
   ```

3. **AI Engine**
   ```bash
   cd ai_engine
   pip install -r requirements.txt
   python app.py
   ```

4. **Blockchain Environment**
   - Start Ganache locally on port `7545`.
   - From the `blockchain/` folder, install dependencies and deploy the contract:
   ```bash
   cd blockchain
   npm install
   npx hardhat compile
   npx hardhat run scripts/deploy.js --network ganache
   ```
   - Copy the deployed contract address from the output and update `backend/.env` as `CONTRACT_ADDRESS`.
   - Use a Ganache account private key for `PRIVATE_KEY` to sign backend transactions securely.

5. **Frontend Application**
   ```bash
   cd frontend
   npm install
   npm run dev
   ```

6. **Verify blockchain flow**
   - Submit a bid as a bidder and confirm `bid_hash` and `blockchain_tx_hash` are returned.
   - Run evaluation and confirm `result_hash` and `result_transaction_hash` are stored.
   - Use the frontend `Verify Integrity` button on the dashboard to validate on-chain data.

## Sample Data and Testing

### Generate realistic sample data
From the `backend/` folder, seed the database with tenders, bidders, and bids:
```bash
cd backend
npm install
npm run seed
```

### Run backend API smoke tests
With the backend server running and the database seeded, execute:
```bash
cd backend
npm run test:api
```

This will validate:
- Authentication and login
- Tender creation
- Tender listing
- Bid submission
- Evaluation queueing
- Result retrieval

### Expected test behavior
- Scenario A: lower bid but high delay should not win if a higher bid has lower true cost
- Scenario B: similar bid totals should favor the bidder with better performance metrics
- Scenario C: high social impact and delay should favor the lower-delay bid

## License
MIT
