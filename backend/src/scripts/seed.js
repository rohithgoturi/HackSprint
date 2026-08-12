require('dotenv').config();
const connectDB = require('../config/db');
const User = require('../models/User');

const seedUsers = [
  {
    name: 'System Admin',
    email: 'admin@civic.local',
    password: 'AdminPassword123!',
    role: 'ADMIN',
    phone: '9998887770'
  },
  {
    name: 'Field Officer',
    email: 'worker@civic.local',
    password: 'WorkerPassword123!',
    role: 'FIELD_WORKER',
    phone: '9998887771'
  },
  {
    name: 'Default Citizen',
    email: 'citizen@civic.local',
    password: 'CitizenPassword123!',
    role: 'CITIZEN',
    phone: '9998887772'
  }
];

/**
 * Development database seed script
 */
const runSeed = async () => {
  if (process.env.NODE_ENV === 'production') {
    console.error('[Seed Error] Database seeding is strictly forbidden in production.');
    process.exit(1);
  }

  try {
    console.log('[Seed] Connecting to database...');
    await connectDB();

    for (const seedData of seedUsers) {
      const existing = await User.findOne({ email: seedData.email });
      if (existing) {
        console.log(`[Seed] User ${seedData.email} already exists (${existing.role}). Skipping.`);
      } else {
        const created = await User.create(seedData);
        console.log(`[Seed] Created ${created.role} account: ${created.email}`);
      }
    }

    console.log('[Seed] Development seeding completed successfully.');
    process.exit(0);
  } catch (error) {
    console.error(`[Seed Error] Seeding failed: ${error.message}`);
    process.exit(1);
  }
};

runSeed();
