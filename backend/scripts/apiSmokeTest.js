require('dotenv').config();
const axios = require('axios');
const FormData = require('form-data');

const baseURL = process.env.API_BASE_URL || 'http://localhost:3000/api';
const client = axios.create({ baseURL, timeout: 20000 });

const admin = { email: 'admin@example.com', password: 'AdminPass123!' };
const bidders = [
  { email: 'bidder1@example.com', password: 'BidderPass1!' },
  { email: 'bidder2@example.com', password: 'BidderPass2!' }
];

let adminToken = null;
let bidderToken = null;

const log = (label, data) => console.log(`\n=== ${label} ===\n`, data);

async function post(path, body, token) {
  const headers = token ? { Authorization: `Bearer ${token}` } : {};
  return client.post(path, body, { headers });
}

async function get(path, token) {
  const headers = token ? { Authorization: `Bearer ${token}` } : {};
  return client.get(path, { headers });
}

async function login(email, password) {
  try {
    const res = await post('/auth/login', { email, password });
    return res.data.token;
  } catch (err) {
    if (err.response) {
      console.error(`Login failed (${email}):`, err.response.data);
    } else {
      console.error('Login error:', err.message);
    }
    return null;
  }
}

async function runApiTests() {
  console.log('Starting backend API smoke tests...');

  adminToken = await login(admin.email, admin.password);
  if (!adminToken) {
    console.warn('Admin login failed; registration may be required or backend not running.');
  } else {
    log('Admin Login', { tokenPresent: !!adminToken });
  }

  bidderToken = await login(bidders[0].email, bidders[0].password);
  if (!bidderToken) {
    console.warn('Bidder login failed; sample bidder may be missing.');
  } else {
    log('Bidder Login', { tokenPresent: !!bidderToken });
  }

  if (adminToken) {
    try {
      const tenderPayload = {
        title: 'API Test Tender',
        description: 'Generated during smoke test for API validation.',
        estimated_budget: 650000,
        deadline: '2025-11-30 18:00:00',
        required_experience: 'Data systems and infrastructure',
        project_type: 'IT'
      };
      const res = await post('/tender', tenderPayload, adminToken);
      log('Tender Creation', res.data);
    } catch (err) {
      log('Tender Creation Error', err.response ? err.response.data : err.message);
    }

    try {
      const res = await get('/tender', adminToken);
      log('Tender List', { count: res.data.length, sample: res.data.slice(0, 2) });
    } catch (err) {
      log('Tender List Error', err.response ? err.response.data : err.message);
    }
  }

  if (bidderToken) {
    try {
      const getTenders = await get('/tender', bidderToken);
      const targetTender = getTenders.data[0];
      if (targetTender) {
        const bidPayload = new FormData();
        bidPayload.append('tender_id', targetTender.id);
        bidPayload.append('quoted_bid', 560000);
        bidPayload.append('estimated_completion_days', 80);

        const res = await client.post('/bid', bidPayload, {
          headers: {
            Authorization: `Bearer ${bidderToken}`,
            ...bidPayload.getHeaders()
          },
          maxBodyLength: Infinity
        });
        log('Bid Submission', res.data);
      } else {
        console.warn('No tender available for bid submission.');
      }
    } catch (err) {
      log('Bid Submission Error', err.response ? err.response.data : err.message);
    }
  }

  if (adminToken) {
    try {
      const tendersRes = await get('/tender', adminToken);
      const firstTender = tendersRes.data[0];
      if (firstTender) {
        const res = await post(`/evaluate/${firstTender.id}`, {}, adminToken);
        log('Evaluation Queue', res.data);
      }
    } catch (err) {
      log('Evaluation Queue Error', err.response ? err.response.data : err.message);
    }
  }

  if (adminToken) {
    try {
      const tendersRes = await get('/tender', adminToken);
      const firstTender = tendersRes.data[0];
      if (firstTender) {
        const res = await get(`/result/${firstTender.id}`, adminToken);
        log('Result Retrieval', res.data);
      }
    } catch (err) {
      log('Result Retrieval Error', err.response ? err.response.data : err.message);
    }
  }

  console.log('\nAPI smoke tests completed.');
}

runApiTests().catch((err) => {
  console.error('Smoke test execution failed:', err);
  process.exit(1);
});
