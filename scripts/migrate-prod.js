#!/usr/bin/env node
/**
 * Migration script for Render deploy
 * Runs drizzle-kit push to create/update tables in PostgreSQL
 * Usage: DATABASE_URL=postgresql://... node scripts/migrate-prod.js
 */
import { execSync } from "child_process";

const databaseUrl = process.env.DATABASE_URL;

if (!databaseUrl) {
  console.error("❌ DATABASE_URL is required");
  process.exit(1);
}

if (!databaseUrl.startsWith("postgresql://")) {
  console.error("❌ DATABASE_URL must be a postgresql:// connection string");
  process.exit(1);
}

console.log("🔄 Running database migrations...");

try {
  execSync("npx drizzle-kit push", {
    stdio: "inherit",
    env: { ...process.env, NODE_ENV: "production" },
  });
  console.log("✅ Migrations completed");
} catch (error) {
  console.error("❌ Migration failed:", error.message);
  process.exit(1);
}
