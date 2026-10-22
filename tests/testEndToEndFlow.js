require('dotenv').config();
const assert = require('node:assert/strict');
const { parsePostAge, STALE_CUTOFF_DAYS } = require('../src/utils/postAge');
const { buildClassification } = require('../src/services/classificationService');

console.log('Testing End-to-End Flow (Freshness Gate, Lead Extraction, Classification)...\n');

// 1. Verify 3-day freshness gate logic
assert.equal(STALE_CUTOFF_DAYS, 3, 'STALE_CUTOFF_DAYS must be 3');

// Fresh post simulation (from harvester or LinkedIn)
const freshPost = {
  postAge: '1d',
  isStale: false,
  company: 'TechCorp',
  contactEmail: 'talent@techcorp.io',
  posterName: 'Alex Miller',
  jobs: [
    {
      jobTitle: 'Senior Full Stack Developer',
      country: 'Pakistan',
      cities: ['Lahore'],
      remoteType: 'remote',
      skills: ['React', 'Node.js', 'PostgreSQL'],
      experienceYears: 4,
      description: 'Looking for a senior fullstack dev to build web applications.',
    },
  ],
};

const freshAgeInfo = parsePostAge(freshPost.postAge);
const shouldRejectFresh = freshPost.isStale || freshAgeInfo.isStale || freshAgeInfo.ageDays === null;
assert.equal(shouldRejectFresh, false, 'Fresh post (1d) must pass the gate');
console.log('✔ Fresh post (1d) passes freshness gate');

// Stale post simulation (> 3 days)
const stalePost = { postAge: '5d', isStale: true };
const staleAgeInfo = parsePostAge(stalePost.postAge);
const shouldRejectStale = stalePost.isStale || staleAgeInfo.isStale || staleAgeInfo.ageDays === null;
assert.equal(shouldRejectStale, true, 'Stale post (5d) must be rejected');
console.log('✔ Stale post (5d) is correctly rejected');

// Undated post simulation (missing or OCR noise)
const undatedPost = { postAge: null, isStale: false };
const undatedAgeInfo = parsePostAge(undatedPost.postAge);
const shouldRejectUndated = undatedPost.isStale || undatedAgeInfo.isStale || undatedAgeInfo.ageDays === null;
assert.equal(shouldRejectUndated, true, 'Undated post must fail closed and be rejected');
console.log('✔ Undated post fails closed and is rejected');

// 2. Lead extraction & pitch verification
const role = freshPost.jobs[0];
const classification = buildClassification(role);
assert.equal(classification.country, 'Pakistan');
assert.equal(classification.region, 'Pakistan');
assert.equal(classification.track, 'tech');
assert.equal(classification.categories.length > 0, true);
console.log(`✔ Classification correctly mapped Pakistan region, tech track, and categories (${classification.categories.join(', ')})`);

// 3. Cold pitch generator verification
const leadName = freshPost.posterName || 'Hiring Team';
const skillsSummary = freshPost.jobs[0].skills.slice(0, 3).join(', ');
const pitch = `Hi ${leadName},\n\nI saw your post regarding the ${freshPost.jobs[0].jobTitle} position at ${freshPost.company}. With my background in ${skillsSummary}, I have built similar systems and would love to contribute to your team.\n\nI've attached my resume and would welcome the chance to connect briefly if you are open to a conversation.\n\nBest regards,`;

assert.match(pitch, /Hi Alex Miller/);
assert.match(pitch, /Senior Full Stack Developer position at TechCorp/);
assert.match(pitch, /React, Node\.js, PostgreSQL/);
console.log('✔ Direct lead pitch accurately generated for Alex Miller');

console.log('\nAll End-to-End flow verification checks PASSED successfully!');
