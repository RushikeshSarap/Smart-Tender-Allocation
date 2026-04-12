require('dotenv').config();
const express = require('express');
const cors = require('cors');
const mysql = require('mysql2/promise');
const path = require('path');

const app = express();
app.use(cors());
app.use(express.json());
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

const port = process.env.PORT || 3000;

app.get('/', (req, res) => {
  res.send('Smart Tender Allocation Backend API');
});

// We will add DB connection and routes shortly.
const authRoutes = require('./routes/auth');
const tendersRoutes = require('./routes/tenders');
const bidsRoutes = require('./routes/bids');
const evaluateRoutes = require('./routes/evaluate');
const resultRoutes = require('./routes/result');
const blockchainRoutes = require('./routes/blockchain');

app.use('/api/auth', authRoutes);
app.use('/api/tender', tendersRoutes);
app.use('/api/bid', bidsRoutes);
app.use('/api/evaluate', evaluateRoutes);
app.use('/api/result', resultRoutes);
app.use('/api/blockchain', blockchainRoutes);

app.listen(port, () => {
  console.log(`Backend server running on http://localhost:${port}`);
});
