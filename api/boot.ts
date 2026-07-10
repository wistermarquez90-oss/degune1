import { Hono } from "hono";
import { bodyLimit } from "hono/body-limit";
import type { HttpBindings } from "@hono/node-server";
import { fetchRequestHandler } from "@trpc/server/adapters/fetch";
import { appRouter } from "./router";
import { createContext } from "./context";
import { env } from "./lib/env";
import { Paths } from "@contracts/constants";
import { execSync } from "child_process";

const app = new Hono<{ Bindings: HttpBindings }>();

app.use(bodyLimit({ maxSize: 50 * 1024 * 1024 }));

// Only register OAuth callback if Kimi OAuth is configured
if (env.kimiAuthUrl) {
  const { createOAuthCallbackHandler } = await import("./kimi/auth");
  app.get(Paths.oauthCallback, createOAuthCallbackHandler());
}

// Migration endpoint — runs drizzle-kit push
app.post("/api/migrate", async (c) => {
  try {
    execSync("npx drizzle-kit push", {
      stdio: "pipe",
      env: { ...process.env, NODE_ENV: "production" },
    });
    return c.json({ success: true, message: "Migrations applied" });
  } catch (error: any) {
    return c.json({ success: false, error: error.message }, 500);
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
