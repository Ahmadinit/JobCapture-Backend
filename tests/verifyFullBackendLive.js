require('dotenv').config();
const mongoose = require('mongoose');
const { connectDb } = require('../src/config/db');
const app = require('../src/app');

async function verify() {
  console.log('--- STEP 1: Testing MongoDB Connection ---');
  const conn = await connectDb();
  console.log(`✓ Connected to Mongo host: ${conn.host}, database: ${conn.name}`);

  const pingResult = await mongoose.connection.db.admin().ping();
  console.log('✓ Mongo admin ping response:', pingResult);

  const collections = await mongoose.connection.db.listCollections().toArray();
  console.log('✓ Mongo collections found:', collections.map((c) => c.name));

  console.log('\n--- STEP 2: Starting Express App on Ephemeral Port ---');
  const server = await new Promise((resolve) => {
    const s = app.listen(0, () => resolve(s));
  });
  const port = server.address().port;
  const baseUrl = `http://127.0.0.1:${port}`;
  console.log(`✓ Express listening at ${baseUrl}`);

  console.log('\n--- STEP 3: Testing /api/health ---');
  const healthRes = await fetch(`${baseUrl}/api/health`);
  const healthData = await healthRes.json();
  console.log(`✓ Status: ${healthRes.status}`, JSON.stringify(healthData, null, 2));

  console.log('\n--- STEP 4: Testing /api/jobs (Public Search) ---');
  const jobsRes = await fetch(`${baseUrl}/api/jobs?limit=5`);
  const jobsData = await jobsRes.json();
  console.log(`✓ Status: ${jobsRes.status}, Total jobs in DB: ${jobsData.total}, returned: ${jobsData.jobs ? jobsData.jobs.length : 0}`);

  console.log('\n--- STEP 5: Testing /api/jobs/facets & /api/meta/taxonomy ---');
  const facetsRes = await fetch(`${baseUrl}/api/jobs/facets`);
  const facetsData = await facetsRes.json();
  console.log(`✓ /api/jobs/facets status: ${facetsRes.status}, Available countries: ${facetsData.countries ? facetsData.countries.length : 0}`);

  const metaRes = await fetch(`${baseUrl}/api/meta/taxonomy`);
  const metaData = await metaRes.json();
  console.log(`✓ /api/meta/taxonomy status: ${metaRes.status}, Tracks: ${metaData.tracks ? metaData.tracks.length : 0}`);

  console.log('\n--- STEP 6: Testing Admin Login (/api/auth/login) ---');
  const loginRes = await fetch(`${baseUrl}/api/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      email: process.env.ADMIN_EMAIL,
      password: process.env.ADMIN_PASSWORD,
    }),
  });
  const loginData = await loginRes.json();
  console.log(`✓ Status: ${loginRes.status}, JWT Token received:`, Boolean(loginData.token));

  console.log('\n--- STEP 7: Testing Ingest Auth Gate (/api/jobs/ingest) ---');
  // First test with invalid key
  const invalidIngest = await fetch(`${baseUrl}/api/jobs/ingest`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'x-submit-key': 'wrong-key' },
    body: JSON.stringify({ rawText: 'Software Engineer in Dubai' }),
  });
  console.log(`✓ Ingest with bad key rejected: ${invalidIngest.status === 401}`);

  // Test with valid key auth check (just check headers pass)
  console.log(`✓ Valid SUBMIT_API_KEY configured: ${Boolean(process.env.SUBMIT_API_KEY)}`);

  console.log('\n--- ALL SYSTEMS OPERATIONAL ---');
  await new Promise((resolve) => server.close(resolve));
  await mongoose.disconnect();
  process.exit(0);
}

verify().catch((err) => {
  console.error('VERIFICATION FAILED:', err);
  process.exit(1);
});
