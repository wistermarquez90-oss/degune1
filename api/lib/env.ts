import "dotenv/config";

function required(name: string): string {
  const value = process.env[name];
  if (!value && process.env.NODE_ENV === "production") {
    throw new Error(`Missing required environment variable: ${name}`);
  }
  return value ?? "";
}

function optional(name: string): string {
  return process.env[name] ?? "";
}

export const env = {
  // OAuth / Kimi (optional — only needed for Kimi login)
  appId: optional("APP_ID"),
  appSecret: optional("APP_SECRET"),
  kimiAuthUrl: optional("KIMI_AUTH_URL"),
  kimiOpenUrl: optional("KIMI_OPEN_URL"),
  ownerUnionId: optional("OWNER_UNION_ID"),

  // Required — lazy getter so it doesn't throw on module import
  isProduction: process.env.NODE_ENV === "production",
  get databaseUrl() {
    return required("DATABASE_URL");
  },
};
