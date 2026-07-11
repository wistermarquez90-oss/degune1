import { z } from "zod";
import { createRouter, publicQuery, adminQuery } from "./middleware";
import { getDb } from "./queries/connection";
import { dengueCases } from "@db/schema";
import * as XLSX from "xlsx";

export const importRouter = createRouter({
  importExcel: adminQuery
    .input(
      z.object({
        // Base64 encoded Excel file
        fileBase64: z.string().min(1),
      })
    )
    .mutation(async ({ input }) => {
      try {
        // Decode base64 to buffer
        const buffer = Buffer.from(input.fileBase64, "base64");

        // Parse Excel
        const workbook = XLSX.read(buffer, { type: "buffer" });
        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];
        const rows = XLSX.utils.sheet_to_json(worksheet, { header: 1 }) as any[][];

        if (rows.length < 2) {
          return { success: false, error: "El archivo está vacío o no tiene datos" };
        }

        // Skip header row, process data rows
        const headers = rows[0];
        const dataRows = rows.slice(1);

        const db = getDb();
        const inserted: any[] = [];
        const errors: string[] = [];

        for (let i = 0; i < dataRows.length; i++) {
          const row = dataRows[i];
          if (!row || row.length < 13) continue;

          // Column mapping (0-indexed)
          // 0: Nº, 1: SEM, 2: Fecha, 3: Nombres y Apellidos
          // 4: M (masculino), 5: F (femenino), 6: H (hospitalizado)
          // 7: Diagnóstico, 8: MU (muestra), 9: Dirección
          // 10: Parroquia, 11: Municipio, 12: Reportado por

          const semana = row[1] ? String(row[1]).trim() : null;
          const fechaRaw = row[2];
          const nombres = row[3] ? String(row[3]).trim() : null;
          const edadM = row[4] ? Number(row[4]) : null;
          const edadF = row[5] ? Number(row[5]) : null;
          const hospitalizado = row[6] ? String(row[6]).trim() : null;
          const diagnostico = row[7] ? String(row[7]).trim() : null;
          const muestra = row[8] ? String(row[8]).trim() : null;
          const direccion = row[9] ? String(row[9]).trim() : null;
          const parroquia = row[10] ? String(row[10]).trim() : null;
          const municipio = row[11] ? String(row[11]).trim() : null;
          const reportadoPor = row[12] ? String(row[12]).trim() : null;

          // Determine sexo and edad
          let sexo: "M" | "F" | null = null;
          let edad: number | null = null;

          if (edadM !== null && !isNaN(edadM) && edadM > 0) {
            sexo = "M";
            edad = Math.floor(edadM);
          } else if (edadF !== null && !isNaN(edadF) && edadF > 0) {
            sexo = "F";
            edad = Math.floor(edadF);
          }

          // Skip if essential data is missing
          if (!semana || !nombres || !sexo || !edad || !diagnostico) {
            continue;
          }

          // Parse fecha
          let fecha: Date;
          if (fechaRaw instanceof Date) {
            fecha = fechaRaw;
          } else if (typeof fechaRaw === "number") {
            // Excel serial date
            fecha = XLSX.SSF.parse_date_code(fechaRaw) as any;
            if (!fecha) {
              fecha = new Date((fechaRaw - 25569) * 86400 * 1000);
            }
          } else if (typeof fechaRaw === "string") {
            fecha = new Date(fechaRaw);
          } else {
            fecha = new Date();
          }

          // Normalize values
          const sexoNorm = sexo;
          const hospNorm = hospitalizado === "SI" ? "SI" : "NO";
          const diagNorm = diagnostico === "DENGUE CON SIGNOS DE ALARMA" ? "DENGUE CON SIGNOS DE ALARMA" : "DENGUE SIN SIGNOS DE ALARMA";
          const muestraNorm = muestra === "SI" ? "SI" : "NO";

          try {
            await db.insert(dengueCases).values({
              semana,
              fecha,
              nombresApellidos: nombres.toUpperCase(),
              edad,
              sexo: sexoNorm,
              hospitalizado: hospNorm,
              diagnostico: diagNorm,
              muestra: muestraNorm,
              direccion: direccion || null,
              parroquia: parroquia || "SIN PARROQUIA",
              municipio: municipio || "SIN MUNICIPIO",
              reportadoPor: reportadoPor || "SIN ESPECIFICAR",
            });
            inserted.push({ nombres, semana, municipio });
          } catch (err: any) {
            errors.push(`Fila ${i + 2}: ${err.message}`);
          }
        }

        return {
          success: true,
          inserted: inserted.length,
          errors: errors.length > 0 ? errors.slice(0, 10) : undefined,
          totalRows: dataRows.length,
        };
      } catch (err: any) {
        return { success: false, error: err.message };
      }
    }),
});
