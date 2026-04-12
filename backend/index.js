require('dotenv').config();
const express = require('express');
const cors = require('cors');
const mysql = require('mysql2/promise');

const app = express();
app.use(cors());
app.use(express.json());

const port = process.env.PORT || 3000;

app.get('/', (req, res) => {
  res.send('Smart Tender Allocation Backend API');
});

// We will add DB connection and routes shortly.
const authRoutes = require('./routes/auth');
const tendersRoutes = require('./routes/tenders');
const bidsRoutes = require('./routes/bids');

app.use('/auth', authRoutes);
app.use('/tenders', tendersRoutes);
app.use('/bids', bidsRoutes);

app.listen(port, () => {
  console.log(`Backend server running on http://localhost:${port}`);
});
