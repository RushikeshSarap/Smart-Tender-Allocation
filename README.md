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
   - Import the `backend/init.sql` schema into your MySQL root server.
   - Update `backend/.env` with your DB password and settings.

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
   - Start Ganache locally on port 7545.
   ```bash
   cd blockchain
   npm install
   npx hardhat compile
   npx hardhat run scripts/deploy.js --network ganache
   ```

5. **Frontend Application**
   ```bash
   cd frontend
   npm install
   npm run dev
   ```

## License
MIT
