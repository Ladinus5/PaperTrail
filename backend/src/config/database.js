const { PrismaClient } = require('@prisma/client');
const { PrismaPg } = require('@prisma/adapter-pg');

// Parse the connection string from your .env
const connectionString = process.env.DATABASE_URL;

// Prisma 7 workaround: parse the URL and pass explicit params for SSL
const url = new URL(connectionString);

const adapter = new PrismaPg({
  host: url.hostname,
  port: parseInt(url.port, 10),
  database: url.pathname.substring(1), // remove leading slash
  user: url.username,
  password: url.password,
  ssl: { rejectUnauthorized: false }, // Prisma Postgres requires SSL
});

const prisma = new PrismaClient({ adapter });

module.exports = prisma;