import { config } from "dotenv";
// Load environment variables from .env file
config();

import { drizzle } from "drizzle-orm/node-postgres";
import pg from "pg";
import * as schema from "@shared/schema";

const { Pool } = pg;

/**
 * ⚠️ SECURITY WARNING:
 * This module initializes the database connection using DATABASE_URL from environment variables.
 * Ensure:
 * - DATABASE_URL contains credentials and is NEVER committed to version control
 * - Use strong database passwords
 * - Enable SSL/TLS for database connections in production
 * - Restrict database access to necessary services only
 * - Regularly backup your database
 */

if (!process.env.DATABASE_URL) {
  throw new Error(
    "DATABASE_URL must be set. Did you forget to provision a database?",
  );
}

export const pool = new Pool({ connectionString: process.env.DATABASE_URL });
export const db = drizzle(pool, { schema });
