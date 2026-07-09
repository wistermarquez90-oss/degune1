import type { FetchCreateContextFnOptions } from "@trpc/server/adapters/fetch";
import type { User } from "@db/schema";
import { authenticateRequest } from "./kimi/auth";
import { getLocalAuthUser } from "./local-auth-router";

export type TrpcContext = {
  req: Request;
  resHeaders: Headers;
  user?: User;
  localUser?: {
    id: number;
    name: string;
    username: string;
    role: string;
    createdAt: Date;
  } | null;
};

export async function createContext(
  opts: FetchCreateContextFnOptions,
): Promise<TrpcContext> {
  const ctx: TrpcContext = { req: opts.req, resHeaders: opts.resHeaders };

  // Try Kimi OAuth first
  try {
    ctx.user = await authenticateRequest(opts.req.headers);
  } catch {
    // OAuth not available
  }

  // Also try local auth
  try {
    ctx.localUser = await getLocalAuthUser(opts.req.headers);
  } catch {
    // Local auth not available
  }

  return ctx;
}
