import { betterAuth } from 'better-auth';
import { prismaAdapter } from 'better-auth/adapters/prisma';
import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import { Pool } from 'pg';

// Use the same configuration as PrismaService
const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const adapter = new PrismaPg(pool);

const prisma = new PrismaClient({
  adapter,
});

export const auth = betterAuth({
  database: prismaAdapter(prisma, {
    provider: 'postgresql',
  }),
  emailAndPassword: {
    enabled: true,
    requireEmailVerification: false, // Set to true in production
  },
  socialProviders: {
    google: {
      clientId: process.env.GOOGLE_CLIENT_ID || '',
      clientSecret: process.env.GOOGLE_CLIENT_SECRET || '',
    },
  },
  session: {
    expiresIn: 60 * 60 * 24 * 7, // 7 days
    updateAge: 60 * 60 * 24, // 1 day
  },
  user: {
    additionalFields: {
      roles: {
        type: 'string',
        defaultValue: 'BUYER',
      },
      phone: {
        type: 'string',
        required: false,
      },
      isEmailVerified: {
        type: 'boolean',
        defaultValue: false,
      },
      isPhoneVerified: {
        type: 'boolean',
        defaultValue: false,
      },
    },
  },
});

export type Session = typeof auth.$Infer.Session;
export type User = typeof auth.$Infer.Session.user;