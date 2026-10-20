require('dotenv').config();
const mongoose = require('mongoose');
const { connectDb } = require('../config/db');
const Job = require('../models/Job');
const { resolveLocation } = require('../taxonomy');
const { registerCompany } = require('../services/companyService');

const PROD_URL = 'https://job-capture-backend.vercel.app/api/jobs?limit=1000';

async function sync() {
  console.log(`Connecting to MongoDB Atlas...`);
  await connectDb();

  console.log(`Fetching production LinkedIn jobs from ${PROD_URL}...`);
  const res = await fetch(PROD_URL);
  if (!res.ok) throw new Error(`Production API returned ${res.status}`);

  const body = await res.json();
  const jobs = body.jobs || body.data || [];
  console.log(`Retrieved ${jobs.length} jobs from production!`);

  let inserted = 0;
  let updated = 0;

  for (const item of jobs) {
    const loc = resolveLocation({
      country: item.country,
      cities: item.cities,
      location: item.location,
    });

    const companyKey = await registerCompany(item.company, {
      fallback: !!item.isCompanyNameFallback,
      posterName: item.posterName,
    });

    const doc = {
      rawText: item.rawText || `[Synced from production] ${item.jobTitle} at ${item.company}`,
      jobTitle: item.jobTitle,
      company: item.company,
      companyKey,
      isCompanyNameFallback: !!item.isCompanyNameFallback,
      categories: item.categories || [],
      skills: item.skills || [],
      unknownSkills: item.unknownSkills || [],
      track: item.track || 'tech',
      stack: item.stack || null,
      experienceYears: item.experienceYears ?? null,
      country: loc.country || 'Pakistan', // default to Pakistan for historic local captures
      region: loc.region || 'Pakistan',
      cities: loc.cities || [],
      location: item.location || loc.cities.join(', ') || 'Pakistan',
      remoteType: item.remoteType || 'onsite',
      remoteScope: item.remoteScope || null,
      postAge: item.postAge || null,
      postedAt: item.postedAt ? new Date(item.postedAt) : new Date(item.createdAt),
      isStale: !!item.isStale,
      description: item.description || '',
      contactEmail: item.contactEmail || null,
      applicationLink: item.applicationLink || null,
      posterName: item.posterName || null,
      sourceUrl: item.sourceUrl || null,
      sourceUrlNormalized: item.sourceUrlNormalized || null,
      status: item.status || 'open',
      createdAt: item.createdAt ? new Date(item.createdAt) : new Date(),
      updatedAt: item.updatedAt ? new Date(item.updatedAt) : new Date(),
    };

    const existing = await Job.findById(item._id);
    if (!existing) {
      await Job.create({ _id: item._id, ...doc });
      inserted++;
    } else {
      await Job.findByIdAndUpdate(item._id, { $set: doc });
      updated++;
    }
  }

  const totalNow = await Job.countDocuments({ status: 'open' });
  console.log(`\n--- SYNC COMPLETE ---`);
  console.log(`Inserted: ${inserted}`);
  console.log(`Updated: ${updated}`);
  console.log(`Total active jobs now in Atlas: ${totalNow}`);

  await mongoose.disconnect();
  process.exit(0);
}

sync().catch((err) => {
  console.error('Sync failed:', err);
  process.exit(1);
});
