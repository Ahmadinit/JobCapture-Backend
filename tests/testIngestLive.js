require('dotenv').config();
const { structureJobPost } = require('../src/services/geminiService');
const { buildClassification } = require('../src/services/classificationService');

const samplePost = `Like · Comment · Share · 2d
Careem is expanding our platform engineering team in MENA & Pakistan!

We are hiring for the following roles:
1. Senior MLOps Engineer
   Location: Dubai, UAE (Hybrid - 3 days office)
   Experience: Minimum 4 years
   Requirements: Python, Docker, Kubernetes, PyTorch, MLOps, CI/CD, AWS.

2. Full Stack AI Engineer
   Location: Remote (Pakistan only)
   Experience: 3+ years
   Requirements: React, Node.js, TypeScript, FastAPI, PostgreSQL, LangChain.

Send your resumes to careers@careem.com or apply at https://careem.com/careers`;

async function testLive() {
  console.log(`Testing Live Ingest Pipeline with model from .env (${process.env.LLM_MODEL})...\n`);
  const start = Date.now();
  
  try {
    const structured = await structureJobPost(samplePost);
    const ms = Date.now() - start;
    console.log(`Pipeline structured post in ${ms}ms!\n`);
    console.log(`Extracted Post-level info:`);
    console.log(`- Company: ${structured.company} (fallback: ${structured.isCompanyNameFallback})`);
    console.log(`- Contact Email: ${structured.contactEmail}`);
    console.log(`- Application Link: ${structured.applicationLink}`);
    console.log(`- Post Age: ${structured.postAge}`);
    console.log(`- Is Stale: ${structured.isStale}`);
    console.log(`- Distinct Jobs Count: ${structured.jobs.length}\n`);

    structured.jobs.forEach((job, idx) => {
      console.log(`--- Job #${idx + 1}: ${job.jobTitle} ---`);
      const classification = buildClassification(job);
      console.log(`  Country: ${classification.country}`);
      console.log(`  Region: ${classification.region}`);
      console.log(`  Cities: ${classification.cities.join(', ') || 'None'}`);
      console.log(`  Remote Type: ${job.remoteType}`);
      console.log(`  Remote Scope: ${job.remoteScope || 'None'}`);
      console.log(`  Primary Category: ${classification.categories[0]}`);
      console.log(`  Track: ${classification.track}`);
      console.log(`  Skills: ${classification.skills.join(', ')}`);
      console.log(`  Experience: ${job.experienceYears} yrs`);
      console.log('');
    });

    console.log('All live checks PASSED!');
  } catch (err) {
    console.error('Live ingest failed:', err);
    process.exit(1);
  }
}

testLive();
