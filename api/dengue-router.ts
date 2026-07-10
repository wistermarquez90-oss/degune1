import { z } from "zod";
import { eq, and, sql, desc, asc } from "drizzle-orm";
import { createRouter, publicQuery, adminQuery } from "./middleware";
import { getDb } from "./queries/connection";
import { dengueCases } from "@db/schema";

const listInput = z.object({
  semana: z.string().optional(),
  sexo: z.enum(["M", "F"]).optional(),
  diagnostico: z
    .enum(["DENGUE SIN SIGNOS DE ALARMA", "DENGUE CON SIGNOS DE ALARMA"])
    .optional(),
  hospitalizado: z.enum(["SI", "NO"]).optional(),
  parroquia: z.string().optional(),
  municipio: z.string().optional(),
  limit: z.number().min(1).max(500).default(100),
  offset: z.number().min(0).default(0),
});

export const dengueRouter = createRouter({
  // ─── Public: List cases with filters ───
  list: publicQuery
    .input(listInput.optional())
    .query(async ({ input }) => {
      const db = getDb();
      const filters = input || {
        limit: 100,
        offset: 0,
      };

      let query = db.select().from(dengueCases);

      const conditions = [];
      if (filters.semana) conditions.push(eq(dengueCases.semana, filters.semana));
      if (filters.sexo) conditions.push(eq(dengueCases.sexo, filters.sexo));
      if (filters.diagnostico) conditions.push(eq(dengueCases.diagnostico, filters.diagnostico));
      if (filters.hospitalizado) conditions.push(eq(dengueCases.hospitalizado, filters.hospitalizado));
      if (filters.parroquia) conditions.push(eq(dengueCases.parroquia, filters.parroquia));
      if (filters.municipio) conditions.push(eq(dengueCases.municipio, filters.municipio));

      if (conditions.length > 0) {
        query = query.where(and(...conditions)) as typeof query;
      }

      const results = await query
        .orderBy(desc(dengueCases.fecha))
        .limit(filters.limit || 100)
        .offset(filters.offset || 0);

      return results;
    }),

  // ─── Public: Get single case ───
  getById: publicQuery
    .input(z.object({ id: z.number() }))
    .query(async ({ input }) => {
      const db = getDb();
      const result = await db
        .select()
        .from(dengueCases)
        .where(eq(dengueCases.id, input.id))
        .limit(1);
      return result[0] || null;
    }),

  // ─── Public: Statistics ───
  stats: publicQuery.query(async () => {
    const db = getDb();

    const totalCases = await db
      .select({ count: sql<number>`count(*)::int` })
      .from(dengueCases);

    const bySexo = await db
      .select({
        sexo: dengueCases.sexo,
        count: sql<number>`count(*)::int`,
      })
      .from(dengueCases)
      .groupBy(dengueCases.sexo);

    const byDiagnostico = await db
      .select({
        diagnostico: dengueCases.diagnostico,
        count: sql<number>`count(*)::int`,
      })
      .from(dengueCases)
      .groupBy(dengueCases.diagnostico);

    const bySemana = await db
      .select({
        semana: dengueCases.semana,
        count: sql<number>`count(*)::int`,
      })
      .from(dengueCases)
      .groupBy(dengueCases.semana)
      .orderBy(asc(dengueCases.semana));

    const byMunicipio = await db
      .select({
        municipio: dengueCases.municipio,
        count: sql<number>`count(*)::int`,
      })
      .from(dengueCases)
      .groupBy(dengueCases.municipio)
      .orderBy(sql<number>`count(*)::int DESC`)
      .limit(10);

    const byParroquia = await db
      .select({
        parroquia: dengueCases.parroquia,
        count: sql<number>`count(*)::int`,
      })
      .from(dengueCases)
      .groupBy(dengueCases.parroquia)
      .orderBy(sql<number>`count(*)::int DESC`)
      .limit(10);

    const hospitalizados = await db
      .select({
        hospitalizado: dengueCases.hospitalizado,
        count: sql<number>`count(*)::int`,
      })
      .from(dengueCases)
      .groupBy(dengueCases.hospitalizado);

    return {
      total: totalCases[0]?.count || 0,
      bySexo,
      byDiagnostico,
      bySemana,
      byMunicipio,
      byParroquia,
      hospitalizados,
    };
  }),

  // ─── Admin: Create case ───
  create: adminQuery
    .input(
      z.object({
        semana: z.string().min(1),
        fecha: z.string().min(1),
        nombresApellidos: z.string().min(1),
        edad: z.number().min(0).max(150),
        sexo: z.enum(["M", "F"]),
        hospitalizado: z.enum(["SI", "NO"]),
        diagnostico: z.enum([
          "DENGUE SIN SIGNOS DE ALARMA",
          "DENGUE CON SIGNOS DE ALARMA",
        ]),
        muestra: z.enum(["SI", "NO"]),
        direccion: z.string().optional(),
        parroquia: z.string().min(1),
        municipio: z.string().min(1),
        reportadoPor: z.string().min(1),
      })
    )
    .mutation(async ({ input }) => {
      const db = getDb();
      await db.insert(dengueCases).values({
        semana: input.semana,
        fecha: new Date(input.fecha),
        nombresApellidos: input.nombresApellidos,
        edad: input.edad,
        sexo: input.sexo,
        hospitalizado: input.hospitalizado,
        diagnostico: input.diagnostico,
        muestra: input.muestra,
        direccion: input.direccion || null,
        parroquia: input.parroquia,
        municipio: input.municipio,
        reportadoPor: input.reportadoPor,
      });
      return { success: true };
    }),

  // ─── Admin: Update case ───
  update: adminQuery
    .input(
      z.object({
        id: z.number(),
        semana: z.string().optional(),
        fecha: z.string().optional(),
        nombresApellidos: z.string().optional(),
        edad: z.number().min(0).max(150).optional(),
        sexo: z.enum(["M", "F"]).optional(),
        hospitalizado: z.enum(["SI", "NO"]).optional(),
        diagnostico: z
          .enum(["DENGUE SIN SIGNOS DE ALARMA", "DENGUE CON SIGNOS DE ALARMA"])
          .optional(),
        muestra: z.enum(["SI", "NO"]).optional(),
        direccion: z.string().optional(),
        parroquia: z.string().optional(),
        municipio: z.string().optional(),
        reportadoPor: z.string().optional(),
      })
    )
    .mutation(async ({ input }) => {
      const db = getDb();
      const { id, ...data } = input;

      const updateData: Record<string, unknown> = {};
      if (data.semana !== undefined) updateData.semana = data.semana;
      if (data.fecha !== undefined) updateData.fecha = new Date(data.fecha);
      if (data.nombresApellidos !== undefined) updateData.nombresApellidos = data.nombresApellidos;
      if (data.edad !== undefined) updateData.edad = data.edad;
      if (data.sexo !== undefined) updateData.sexo = data.sexo;
      if (data.hospitalizado !== undefined) updateData.hospitalizado = data.hospitalizado;
      if (data.diagnostico !== undefined) updateData.diagnostico = data.diagnostico;
      if (data.muestra !== undefined) updateData.muestra = data.muestra;
      if (data.direccion !== undefined) updateData.direccion = data.direccion;
      if (data.parroquia !== undefined) updateData.parroquia = data.parroquia;
      if (data.municipio !== undefined) updateData.municipio = data.municipio;
      if (data.reportadoPor !== undefined) updateData.reportadoPor = data.reportadoPor;

      await db.update(dengueCases).set(updateData).where(eq(dengueCases.id, id));
      return { success: true };
    }),

  // ─── Admin: Delete case ───
  delete: adminQuery
    .input(z.object({ id: z.number() }))
    .mutation(async ({ input }) => {
      const db = getDb();
      await db.delete(dengueCases).where(eq(dengueCases.id, input.id));
      return { success: true };
    }),

  // ─── Public: Filter options ───
  filterOptions: publicQuery.query(async () => {
    const db = getDb();

    const semanas = await db
      .selectDistinct({ semana: dengueCases.semana })
      .from(dengueCases)
      .orderBy(asc(dengueCases.semana));

    const parroquias = await db
      .selectDistinct({ parroquia: dengueCases.parroquia })
      .from(dengueCases)
      .orderBy(asc(dengueCases.parroquia));

    const municipios = await db
      .selectDistinct({ municipio: dengueCases.municipio })
      .from(dengueCases)
      .orderBy(asc(dengueCases.municipio));

    return {
      semanas: semanas.map((s) => s.semana),
      parroquias: parroquias.map((p) => p.parroquia),
      municipios: municipios.map((m) => m.municipio),
    };
  }),
});
