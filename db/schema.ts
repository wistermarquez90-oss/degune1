import {
  mysqlTable,
  mysqlEnum,
  serial,
  varchar,
  text,
  timestamp,
  int,
  date,
} from "drizzle-orm/mysql-core";

export const users = mysqlTable("users", {
  id: serial("id").primaryKey(),
  unionId: varchar("unionId", { length: 255 }).notNull().unique(),
  name: varchar("name", { length: 255 }),
  email: varchar("email", { length: 320 }),
  avatar: text("avatar"),
  role: mysqlEnum("role", ["user", "admin"]).default("user").notNull(),
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
export const dengueCases = mysqlTable("dengue_cases", {
  id: serial("id").primaryKey(),
  semana: varchar("semana", { length: 10 }).notNull(),
  fecha: date("fecha").notNull(),
  nombresApellidos: varchar("nombres_apellidos", { length: 255 }).notNull(),
  edad: int("edad").notNull(),
  sexo: mysqlEnum("sexo", ["M", "F"]).notNull(),
  hospitalizado: mysqlEnum("hospitalizado", ["SI", "NO"]).notNull(),
  diagnostico: mysqlEnum("diagnostico", [
    "DENGUE SIN SIGNOS DE ALARMA",
    "DENGUE CON SIGNOS DE ALARMA",
  ]).notNull(),
  muestra: mysqlEnum("muestra", ["SI", "NO"]).notNull(),
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
export const admins = mysqlTable("admins", {
  id: serial("id").primaryKey(),
  username: varchar("username", { length: 100 }).notNull().unique(),
  passwordHash: varchar("password_hash", { length: 255 }).notNull(),
  name: varchar("name", { length: 255 }).notNull(),
  role: mysqlEnum("role", ["admin", "superadmin"]).default("admin").notNull(),
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
