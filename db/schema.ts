import {
  pgTable,
  pgEnum,
  serial,
  varchar,
  text,
  timestamp,
  integer,
  date,
} from "drizzle-orm/pg-core";

export const roleEnum = pgEnum("role", ["user", "admin"]);
export const sexoEnum = pgEnum("sexo", ["M", "F"]);
export const hospitalizadoEnum = pgEnum("hospitalizado", ["SI", "NO"]);
export const diagnosticoEnum = pgEnum("diagnostico", [
  "DENGUE SIN SIGNOS DE ALARMA",
  "DENGUE CON SIGNOS DE ALARMA",
]);
export const muestraEnum = pgEnum("muestra", ["SI", "NO"]);
export const adminRoleEnum = pgEnum("admin_role", ["admin", "superadmin"]);

export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  unionId: varchar("unionId", { length: 255 }).notNull().unique(),
  name: varchar("name", { length: 255 }),
  email: varchar("email", { length: 320 }),
  avatar: text("avatar"),
  role: roleEnum("role").default("user").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt")
    .defaultNow()
    .notNull()
    .$onUpdate(() => new Date()),
  lastSignInAt: timestamp("lastSignInAt").defaultNow().notNull(),
});

export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;

// ─── Dengue Cases Table ───
export const dengueCases = pgTable("dengue_cases", {
  id: serial("id").primaryKey(),
  semana: varchar("semana", { length: 10 }).notNull(),
  fecha: date("fecha").notNull(),
  nombresApellidos: varchar("nombres_apellidos", { length: 255 }).notNull(),
  edad: integer("edad").notNull(),
  sexo: sexoEnum("sexo").notNull(),
  hospitalizado: hospitalizadoEnum("hospitalizado").notNull(),
  diagnostico: diagnosticoEnum("diagnostico").notNull(),
  muestra: muestraEnum("muestra").notNull(),
  direccion: text("direccion"),
  parroquia: varchar("parroquia", { length: 100 }).notNull(),
  municipio: varchar("municipio", { length: 100 }).notNull(),
  reportadoPor: varchar("reportado_por", { length: 255 }).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at")
    .defaultNow()
    .notNull()
    .$onUpdate(() => new Date()),
});

export type DengueCase = typeof dengueCases.$inferSelect;
export type InsertDengueCase = typeof dengueCases.$inferInsert;

// ─── Local Admins Table (password-based auth) ───
export const admins = pgTable("admins", {
  id: serial("id").primaryKey(),
  username: varchar("username", { length: 100 }).notNull().unique(),
  passwordHash: varchar("password_hash", { length: 255 }).notNull(),
  name: varchar("name", { length: 255 }).notNull(),
  role: adminRoleEnum("role").default("admin").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at")
    .defaultNow()
    .notNull()
    .$onUpdate(() => new Date()),
});

export type Admin = typeof admins.$inferSelect;
export type InsertAdmin = typeof admins.$inferInsert;

// TODO: Add your tables here. See docs/Database.md for schema examples and patterns.
//
// Example:
// export const posts = mysqlTable("posts", {
//   id: serial("id").primaryKey(),
//   title: varchar("title", { length: 255 }).notNull(),
//   content: text("content"),
//   createdAt: timestamp("created_at").notNull().defaultNow(),
// });
//
// Note: FK columns referencing a serial() PK must use:
//   bigint("columnName", { mode: "number", unsigned: true }).notNull()
