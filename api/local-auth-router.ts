import { z } from "zod";
import { eq } from "drizzle-orm";
import { createRouter, publicQuery } from "./middleware";
import { getDb } from "./queries/connection";
import { admins } from "@db/schema";
import { SignJWT, jwtVerify } from "jose";

const JWT_SECRET = new TextEncoder().encode(
  process.env.JWT_SECRET || "dengue-secret-key-2026-change-in-production"
);

export async function createToken(adminId: number, username: string, role: string) {
  return new SignJWT({ adminId, username, role })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("7d")
    .sign(JWT_SECRET);
}

export async function verifyToken(token: string) {
  try {
    const { payload } = await jwtVerify(token, JWT_SECRET, { clockTolerance: 60 });
    return payload as { adminId: number; username: string; role: string };
  } catch {
    return null;
  }
}

export async function getLocalAuthUser(headers: Headers) {
  const token = headers.get("x-local-auth-token");
  if (!token) return null;
  const payload = await verifyToken(token);
  if (!payload) return null;

  const db = getDb();
  const result = await db
    .select()
    .from(admins)
    .where(eq(admins.id, payload.adminId))
    .limit(1);

  if (result.length === 0) return null;
  const admin = result[0];

  return {
    id: admin.id,
    name: admin.name,
    username: admin.username,
    role: admin.role,
    createdAt: admin.createdAt,
  };
}

export const localAuthRouter = createRouter({
  login: publicQuery
    .input(
      z.object({
        username: z.string().min(1),
        password: z.string().min(1),
      })
    )
    .mutation(async ({ input }) => {
      const db = getDb();
      const { hashSync, compareSync } = await import("bcryptjs");

      // Auto-create default admin if no admins exist
      const allAdmins = await db.select().from(admins);
      if (allAdmins.length === 0) {
        const defaultHash = hashSync("admin123", 10);
        await db.insert(admins).values({
          username: "admin",
          passwordHash: defaultHash,
          name: "Administrador",
          role: "superadmin",
        });
      }

      const result = await db
        .select()
        .from(admins)
        .where(eq(admins.username, input.username))
        .limit(1);

      if (result.length === 0) {
        return { success: false, error: "Usuario o contraseña incorrectos" };
      }

      const admin = result[0];
      const valid = compareSync(input.password, admin.passwordHash);
      if (!valid) {
        return { success: false, error: "Usuario o contraseña incorrectos" };
      }

      const token = await createToken(admin.id, admin.username, admin.role);
      return {
        success: true,
        token,
        user: {
          id: admin.id,
          name: admin.name,
          username: admin.username,
          role: admin.role,
        },
      };
    }),

  me: publicQuery.query(async ({ ctx }) => {
    const token = ctx.req.headers.get("x-local-auth-token");
    if (!token) return null;
    const payload = await verifyToken(token);
    if (!payload) return null;

    const db = getDb();
    const result = await db
      .select()
      .from(admins)
      .where(eq(admins.id, payload.adminId))
      .limit(1);

    if (result.length === 0) return null;
    const admin = result[0];

    return {
      id: admin.id,
      name: admin.name,
      username: admin.username,
      role: admin.role,
    };
  }),

  changePassword: publicQuery
    .input(
      z.object({
        currentPassword: z.string().min(1),
        newPassword: z.string().min(4),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const token = ctx.req.headers.get("x-local-auth-token");
      if (!token) return { success: false, error: "No autenticado" };
      const payload = await verifyToken(token);
      if (!payload) return { success: false, error: "Token inválido" };

      const db = getDb();
      const { compareSync, hashSync } = await import("bcryptjs");

      const result = await db
        .select()
        .from(admins)
        .where(eq(admins.id, payload.adminId))
        .limit(1);

      if (result.length === 0) {
        return { success: false, error: "Usuario no encontrado" };
      }

      const admin = result[0];
      const valid = compareSync(input.currentPassword, admin.passwordHash);
      if (!valid) {
        return { success: false, error: "Contraseña actual incorrecta" };
      }

      const newHash = hashSync(input.newPassword, 10);
      await db
        .update(admins)
        .set({ passwordHash: newHash })
        .where(eq(admins.id, admin.id));

      return { success: true };
    }),
});
