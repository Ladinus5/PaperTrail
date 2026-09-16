const { PrismaClient } = require('@prisma/client');
const { PrismaPg } = require('@prisma/adapter-pg');

// Create the adapter with your database connection string
const adapter = new PrismaPg({
  connectionString: process.env.DATABASE_URL,
});

// Instantiate PrismaClient WITH the adapter
const prisma = new PrismaClient({ adapter });

module.exports = prisma;

console.log("DATABASE_URL from env:", process.env.DATABASE_URL);