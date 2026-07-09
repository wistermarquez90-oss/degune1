import { Pool } from "pg";

const DATABASE_URL = process.env.DATABASE_URL;

if (!DATABASE_URL) {
  throw new Error("DATABASE_URL is required");
}

const pool = new Pool({ connectionString: DATABASE_URL });

async function migrate() {
  const client = await pool.connect();

  try {
    // Check if admins table exists
    const result = await client.query(
      `SELECT 1 FROM information_schema.tables 
       WHERE table_schema = 'public' AND table_name = 'admins'`
    );

    if (result.rowCount === 0) {
      console.log("Creating admins table...");
      await client.query(`
        CREATE TABLE IF NOT EXISTS admins (
          id SERIAL PRIMARY KEY,
          username VARCHAR(100) NOT NULL UNIQUE,
          password_hash VARCHAR(255) NOT NULL,
          name VARCHAR(255) NOT NULL,
          role VARCHAR(20) NOT NULL DEFAULT 'admin',
          created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
        )
      `);
      console.log("admins table created successfully!");
    } else {
      console.log("admins table already exists.");
    }
  } catch (error) {
    console.error("Migration error:", error);
  } finally {
    client.release();
    await pool.end();
  }
}

migrate();
