import { Hono } from "hono";
import { bodyLimit } from "hono/body-limit";
import type { HttpBindings } from "@hono/node-server";
import { fetchRequestHandler } from "@trpc/server/adapters/fetch";
import { appRouter } from "./router";
import { createContext } from "./context";
import { env } from "./lib/env";
import { Paths } from "@contracts/constants";
import { Pool } from "pg";
import { hashSync } from "bcryptjs";

const app = new Hono<{ Bindings: HttpBindings }>();

app.use(bodyLimit({ maxSize: 50 * 1024 * 1024 }));

// Only register OAuth callback if Kimi OAuth is configured
if (env.kimiAuthUrl) {
  const { createOAuthCallbackHandler } = await import("./kimi/auth");
  app.get(Paths.oauthCallback, createOAuthCallbackHandler());
}

// Migration endpoint — creates tables and default admin using raw SQL
app.post("/api/migrate", async (c) => {
  const databaseUrl = process.env.DATABASE_URL;
  if (!databaseUrl) {
    return c.json({ success: false, error: "DATABASE_URL not set" }, 500);
  }

  const pool = new Pool({ connectionString: databaseUrl });

  try {
    const client = await pool.connect();

    // Create enums if they don't exist
    await client.query(`
      DO $$
      BEGIN
        IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'role') THEN
          CREATE TYPE role AS ENUM ('user', 'admin');
        END IF;
        IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'sexo') THEN
          CREATE TYPE sexo AS ENUM ('M', 'F');
        END IF;
        IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'hospitalizado') THEN
          CREATE TYPE hospitalizado AS ENUM ('SI', 'NO');
        END IF;
        IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'diagnostico') THEN
          CREATE TYPE diagnostico AS ENUM ('DENGUE SIN SIGNOS DE ALARMA', 'DENGUE CON SIGNOS DE ALARMA');
        END IF;
        IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'muestra') THEN
          CREATE TYPE muestra AS ENUM ('SI', 'NO');
        END IF;
        IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'admin_role') THEN
          CREATE TYPE admin_role AS ENUM ('admin', 'superadmin');
        END IF;
      END $$;
    `);

    // Create users table
    await client.query(`
      CREATE TABLE IF NOT EXISTS users (
        id SERIAL PRIMARY KEY,
        "unionId" VARCHAR(255) NOT NULL UNIQUE,
        name VARCHAR(255),
        email VARCHAR(320),
        avatar TEXT,
        role role NOT NULL DEFAULT 'user',
        "createdAt" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "updatedAt" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "lastSignInAt" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Create dengue_cases table
    await client.query(`
      CREATE TABLE IF NOT EXISTS dengue_cases (
        id SERIAL PRIMARY KEY,
        semana VARCHAR(10) NOT NULL,
        fecha DATE NOT NULL,
        nombres_apellidos VARCHAR(255) NOT NULL,
        edad INTEGER NOT NULL,
        sexo sexo NOT NULL,
        hospitalizado hospitalizado NOT NULL,
        diagnostico diagnostico NOT NULL,
        muestra muestra NOT NULL,
        direccion TEXT,
        parroquia VARCHAR(100) NOT NULL,
        municipio VARCHAR(100) NOT NULL,
        reportado_por VARCHAR(255) NOT NULL,
        created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Create admins table
    await client.query(`
      CREATE TABLE IF NOT EXISTS admins (
        id SERIAL PRIMARY KEY,
        username VARCHAR(100) NOT NULL UNIQUE,
        password_hash VARCHAR(255) NOT NULL,
        name VARCHAR(255) NOT NULL,
        role admin_role NOT NULL DEFAULT 'admin',
        created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Create default admin if none exists
    const adminCheck = await client.query('SELECT COUNT(*) FROM admins');
    if (parseInt(adminCheck.rows[0].count) === 0) {
      const defaultHash = hashSync("admin123", 10);
      await client.query(
        `INSERT INTO admins (username, password_hash, name, role) VALUES ($1, $2, $3, $4)`,
        ["admin", defaultHash, "Administrador", "admin"]
      );
    }

    // Fix existing admin role if it's superadmin (for backwards compatibility)
    await client.query(
      `UPDATE admins SET role = 'admin' WHERE role = 'superadmin'`
    );

    client.release();

    return c.json({
      success: true,
      message: "Migrations applied. Default admin created: admin/admin123",
    });
  } catch (error: any) {
    return c.json({ success: false, error: error.message }, 500);
  } finally {
    await pool.end();
  }
});

app.use("/api/trpc/*", async (c) => {
  return fetchRequestHandler({
    endpoint: "/api/trpc",
    req: c.req.raw,
    router: appRouter,
    createContext,
  });
});

// Health check endpoint for Render
app.get("/api/health", (c) => c.json({ status: "ok", timestamp: new Date().toISOString() }));

app.all("/api/*", (c) => c.json({ error: "Not Found" }, 404));

export default app;

if (env.isProduction) {
  const { serve } = await import("@hono/node-server");
  const { serveStaticFiles } = await import("./lib/vite");
  serveStaticFiles(app);

  const port = parseInt(process.env.PORT || "3000");
  serve({ fetch: app.fetch, port }, () => {
    console.log(`Server running on http://localhost:${port}/`);
  });
}
