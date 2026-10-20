require('dotenv').config();
const mongoose = require('mongoose');
const { connectDb } = require('../config/db');
const Job = require('../models/Job');
const { registerCompany } = require('../services/companyService');
const { deriveTrack, deriveLegacyStack } = require('../taxonomy');

const SEED_JOBS = [
  {
    jobTitle: 'Senior MLOps Engineer',
    company: 'Careem',
    country: 'United Arab Emirates',
    region: 'MENA',
    cities: ['Dubai'],
    location: 'Dubai, UAE',
    remoteType: 'hybrid',
    remoteScope: null,
    experienceYears: 4,
    categories: ['AI / ML Engineering', 'DevOps & Cloud'],
    skills: ['Python', 'Docker', 'Kubernetes', 'PyTorch', 'AWS', 'CI/CD'],
    postedDaysAgo: 2,
    description: 'Careem is looking for a Senior MLOps Engineer in Dubai to build scalable ML training and model deployment pipelines on AWS and Kubernetes. Experience with PyTorch and CI/CD required.',
    applicationLink: 'https://careem.com/careers',
    contactEmail: 'talent@careem.com',
  },
  {
    jobTitle: 'Full Stack AI Engineer',
    company: 'Afiniti',
    country: 'Pakistan',
    region: 'Pakistan',
    cities: ['Lahore'],
    location: 'Lahore, Pakistan',
    remoteType: 'onsite',
    remoteScope: null,
    experienceYears: 3,
    categories: ['Fullstack', 'AI / ML Engineering'],
    skills: ['React', 'Node.js', 'Python', 'PostgreSQL', 'TypeScript'],
    postedDaysAgo: 3,
    description: 'Afiniti is hiring a Full Stack AI Engineer in Lahore to design intelligent customer experience solutions. Must have 3+ years in React, Node.js, and Python backend services.',
    applicationLink: 'https://afiniti.com/careers',
    contactEmail: 'careers@afiniti.com',
  },
  {
    jobTitle: 'Cloud Solutions Architect',
    company: 'Aramco Digital',
    country: 'Saudi Arabia',
    region: 'MENA',
    cities: ['Riyadh'],
    location: 'Riyadh, Saudi Arabia',
    remoteType: 'onsite',
    remoteScope: null,
    experienceYears: 5,
    categories: ['DevOps & Cloud', 'Backend'],
    skills: ['AWS', 'Kubernetes', 'Docker', 'CI/CD', 'Linux'],
    postedDaysAgo: 4,
    description: 'Aramco Digital is seeking an experienced Cloud Solutions Architect in Riyadh to accelerate cloud adoption, manage Kubernetes clusters, and architect resilient enterprise workloads.',
    applicationLink: 'https://aramco.com/careers',
    contactEmail: null,
  },
  {
    jobTitle: 'Senior Backend Engineer (Go)',
    company: 'Instabug',
    country: 'Egypt',
    region: 'MENA',
    cities: ['Cairo'],
    location: 'Cairo, Egypt',
    remoteType: 'hybrid',
    remoteScope: null,
    experienceYears: 4,
    categories: ['Backend'],
    skills: ['Go', 'Docker', 'PostgreSQL', 'Redis'],
    postedDaysAgo: 5,
    description: 'Instabug is scaling our backend observability platform in Cairo. Looking for a senior engineer with high-throughput Go microservices and distributed database experience.',
    applicationLink: 'https://instabug.com/careers',
    contactEmail: 'jobs@instabug.com',
  },
  {
    jobTitle: 'Senior Frontend Engineer',
    company: 'Arbisoft',
    country: 'Pakistan',
    region: 'Pakistan',
    cities: ['Lahore'],
    location: 'Lahore, Pakistan',
    remoteType: 'hybrid',
    remoteScope: null,
    experienceYears: 4,
    categories: ['Frontend'],
    skills: ['React', 'Next.js', 'TypeScript', 'Tailwind CSS', 'JavaScript'],
    postedDaysAgo: 1,
    description: 'Arbisoft is hiring a Senior Frontend Developer in Lahore. Build beautiful, high performance web applications using Next.js and TypeScript.',
    applicationLink: 'https://arbisoft.com/careers',
    contactEmail: 'recruitment@arbisoft.com',
  },
  {
    jobTitle: 'DevOps & SRE Engineer',
    company: 'Noon',
    country: 'Saudi Arabia',
    region: 'MENA',
    cities: ['Riyadh'],
    location: 'Riyadh, Saudi Arabia',
    remoteType: 'onsite',
    remoteScope: null,
    experienceYears: 3,
    categories: ['DevOps & Cloud'],
    skills: ['Linux', 'Docker', 'Kubernetes', 'CI/CD', 'AWS'],
    postedDaysAgo: 6,
    description: 'Noon is looking for a DevOps/SRE Engineer in Riyadh to automate e-commerce platform infrastructure, monitoring with Prometheus/Grafana, and zero-downtime deployments.',
    applicationLink: 'https://noon.com/careers',
    contactEmail: null,
  },
  {
    jobTitle: 'Staff AI / LLM Researcher',
    company: 'Devsinc',
    country: 'Pakistan',
    region: 'Pakistan',
    cities: ['Islamabad'],
    location: 'Islamabad, Pakistan',
    remoteType: 'remote',
    remoteScope: 'Pakistan only',
    experienceYears: 4,
    categories: ['AI / ML Engineering'],
    skills: ['Python', 'PyTorch', 'Machine Learning', 'Deep Learning'],
    postedDaysAgo: 2,
    description: 'Devsinc is hiring a Staff AI/LLM Engineer (Remote across Pakistan). Work on fine-tuning foundational models, RAG pipelines, and agentic workflows.',
    applicationLink: 'https://devsinc.com/careers',
    contactEmail: 'careers@devsinc.com',
  },
  {
    jobTitle: 'Senior React Native Developer',
    company: 'Talabat',
    country: 'United Arab Emirates',
    region: 'MENA',
    cities: ['Dubai'],
    location: 'Dubai, UAE',
    remoteType: 'hybrid',
    remoteScope: null,
    experienceYears: 5,
    categories: ['Mobile Development'],
    skills: ['React Native', 'TypeScript', 'React', 'JavaScript'],
    postedDaysAgo: 7,
    description: 'Talabat is hiring a Senior Mobile Engineer in Dubai to evolve rider and customer experiences in React Native. High-scale app performance expertise required.',
    applicationLink: 'https://talabat.com/careers',
    contactEmail: null,

  },
];

async function seed() {
  console.log('Connecting to MongoDB Atlas...');
  await connectDb();

  console.log(`Clearing existing test jobs...`);
  await Job.deleteMany({});

  console.log(`Seeding ${SEED_JOBS.length} modern MENA & Pakistan tech jobs...`);
  for (const item of SEED_JOBS) {
    const postedAt = new Date(Date.now() - item.postedDaysAgo * 24 * 60 * 60 * 1000);
    const companyKey = await registerCompany(item.company, { fallback: false });
    const track = deriveTrack(item.categories);
    const stack = deriveLegacyStack(item.categories, item.skills);

    const job = await Job.create({
      rawText: `[Live Seed] ${item.jobTitle} at ${item.company} in ${item.location}`,
      jobTitle: item.jobTitle,
      company: item.company,
      companyKey,
      isCompanyNameFallback: false,
      categories: item.categories,
      skills: item.skills,
      track,
      stack,
      experienceYears: item.experienceYears,
      country: item.country,
      region: item.region,
      cities: item.cities,
      location: item.location,
      remoteType: item.remoteType,
      remoteScope: item.remoteScope,
      postAge: `${item.postedDaysAgo}d`,
      postedAt,
      isStale: false,
      description: item.description,
      contactEmail: item.contactEmail,
      applicationLink: item.applicationLink,
      status: 'open',
      createdAt: postedAt,
      updatedAt: postedAt,
    });
    console.log(`✓ Seeded: ${job.jobTitle} @ ${job.company} (${job.country} - ${job.region})`);
  }

  const count = await Job.countDocuments({ status: 'open' });
  console.log(`\nSUCCESS: ${count} active jobs populated into MongoDB Atlas!`);
  await mongoose.disconnect();
  process.exit(0);
}

seed().catch((err) => {
  console.error('Seeding failed:', err);
  process.exit(1);
});
