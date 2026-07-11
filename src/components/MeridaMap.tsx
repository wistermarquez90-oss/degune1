import { useState, useMemo } from "react";
import { motion } from "framer-motion";
import { MapPin } from "lucide-react";

interface MapData {
  municipio: string;
  count: number;
}

interface MeridaMapProps {
  data: MapData[];
  selectedSemana?: string;
}

// Los 23 municipios del estado Mérida con posición aproximada en grid
const MUNICIPIOS = [
  // Zona del Páramo (arriba)
  { id: "Miranda", name: "Miranda", capital: "Timotes", x: 0, y: 0, region: "Páramo" },
  { id: "Rangel", name: "Rangel", capital: "Mucuchíes", x: 1, y: 0, region: "Páramo" },
  { id: "Cardenal Quintero", name: "C. Quintero", capital: "Santo Domingo", x: 2, y: 0, region: "Páramo" },
  { id: "Pueblo Llano", name: "Pueblo Llano", capital: "Pueblo Llano", x: 3, y: 0, region: "Páramo" },
  // Zona Metropolitana (centro-arriba)
  { id: "Santos Marquina", name: "S. Marquina", capital: "Tabay", x: 0, y: 1, region: "Metropolitana" },
  { id: "Libertador", name: "Libertador", capital: "Mérida", x: 1, y: 1, region: "Metropolitana" },
  { id: "Campo Elías", name: "Campo Elías", capital: "Ejido", x: 2, y: 1, region: "Metropolitana" },
  { id: "Sucre", name: "Sucre", capital: "Lagunillas", x: 3, y: 1, region: "Metropolitana" },
  // Zona del Mocotíes (derecha)
  { id: "Tovar", name: "Tovar", capital: "Tovar", x: 0, y: 2, region: "Mocotíes" },
  { id: "Rivas Dávila", name: "Rivas Dávila", capital: "Bailadores", x: 1, y: 2, region: "Mocotíes" },
  { id: "Zea", name: "Zea", capital: "Zea", x: 2, y: 2, region: "Mocotíes" },
  { id: "Antonio Pinto Salinas", name: "A. Pinto Salinas", capital: "Santa Cruz", x: 3, y: 2, region: "Mocotíes" },
  { id: "Guaraque", name: "Guaraque", capital: "Guaraque", x: 4, y: 2, region: "Mocotíes" },
  // Zona del Sur del Lago (abajo-izquierda)
  { id: "Alberto Adriani", name: "Alberto Adriani", capital: "El Vigía", x: 0, y: 3, region: "Sur del Lago" },
  { id: "Obispo Ramos de Lora", name: "Obispo Ramos", capital: "Santa Elena", x: 1, y: 3, region: "Sur del Lago" },
  { id: "Andrés Bello", name: "Andrés Bello", capital: "La Azulita", x: 2, y: 3, region: "Sur del Lago" },
  { id: "Caracciolo Parra Olmedo", name: "Caracciolo Parra", capital: "Tucaní", x: 3, y: 3, region: "Sur del Lago" },
  { id: "Justo Briceño", name: "Justo Briceño", capital: "Torondoy", x: 4, y: 3, region: "Sur del Lago" },
  // Zona de los Pueblos del Sur (abajo-derecha)
  { id: "Julio César Salas", name: "J. César Salas", capital: "Arapuey", x: 0, y: 4, region: "Pueblos del Sur" },
  { id: "Tulio Febres Cordero", name: "Tulio Febres", capital: "Nueva Bolivia", x: 1, y: 4, region: "Pueblos del Sur" },
  { id: "Padre Noguera", name: "Padre Noguera", capital: "Santa María", x: 2, y: 4, region: "Pueblos del Sur" },
  { id: "Arzobispo Chacón", name: "Arzobispo Chacón", capital: "Canagua", x: 3, y: 4, region: "Pueblos del Sur" },
  { id: "Aricagua", name: "Aricagua", capital: "Aricagua", x: 4, y: 4, region: "Pueblos del Sur" },
];

const REGION_COLORS: Record<string, string> = {
  "Páramo": "#3b82f6",
  "Metropolitana": "#ef4444",
  "Mocotíes": "#f59e0b",
  "Sur del Lago": "#10b981",
  "Pueblos del Sur": "#8b5cf6",
};

function getColorForCases(count: number, max: number): string {
  if (count === 0) return "#f8fafc";
  if (max === 0) return "#f8fafc";
  const intensity = count / max;
  // Escala de rojo: más claro (menos) a más oscuro (más)
  const r = Math.round(255 - intensity * 200);
  const g = Math.round(255 - intensity * 240);
  const b = Math.round(255 - intensity * 240);
  return `rgb(${r}, ${g}, ${b})`;
}

export default function MeridaMap({ data, selectedSemana }: MeridaMapProps) {
  const [hoveredMun, setHoveredMun] = useState<string | null>(null);

  const dataMap = useMemo(() => {
    const map: Record<string, number> = {};
    for (const d of data) {
      map[d.municipio] = d.count;
    }
    return map;
  }, [data]);

  const maxCount = useMemo(() => {
    if (data.length === 0) return 0;
    return Math.max(...data.map((d) => d.count));
  }, [data]);

  const totalCases = useMemo(() => data.reduce((sum, d) => sum + d.count, 0), [data]);

  // Grid config
  const COLS = 5;
  const CELL_W = 175;
  const CELL_H = 120;
  const GAP = 8;
  const PADDING = 20;
  const SVG_W = PADDING * 2 + COLS * CELL_W + (COLS - 1) * GAP;
  const SVG_H = PADDING * 2 + 5 * CELL_H + 4 * GAP + 40; // +40 for legend

  const getCount = (municipioName: string) => dataMap[municipioName] || 0;

  return (
    <div className="w-full">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <MapPin className="w-5 h-5 text-red-500" />
          <h3 className="text-sm font-semibold text-gray-700">
            Mapa de Casos por Municipio
            {selectedSemana && (
              <span className="ml-2 text-xs font-normal text-gray-500">
                — {selectedSemana}
              </span>
            )}
          </h3>
        </div>
        <div className="text-xs text-gray-500">
          {totalCases} {totalCases === 1 ? "caso" : "casos"}
          {selectedSemana ? ` en ${selectedSemana}` : " en total"}
        </div>
      </div>

      {/* SVG Map */}
      <div className="overflow-x-auto">
        <svg
          viewBox={`0 0 ${SVG_W} ${SVG_H}`}
          className="w-full max-w-4xl mx-auto"
          style={{ minWidth: "600px" }}
        >
          {/* Background */}
          <rect x="0" y="0" width={SVG_W} height={SVG_H} rx="12" fill="#f8fafc" stroke="#e2e8f0" strokeWidth="1" />

          {/* Region labels */}
          {[
            { name: "ZONA DEL PÁRAMO", y: 0 },
            { name: "ZONA METROPOLITANA", y: 1 },
            { name: "ZONA DEL MOCOTÍES", y: 2 },
            { name: "ZONA DEL SUR DEL LAGO", y: 3 },
            { name: "ZONA DE LOS PUEBLOS DEL SUR", y: 4 },
          ].map((region) => (
            <text
              key={region.name}
              x={PADDING - 5}
              y={PADDING + region.y * (CELL_H + GAP) + CELL_H / 2}
              fontSize="9"
              fill="#94a3b8"
              fontWeight="600"
              textAnchor="end"
              transform={`rotate(-90, ${PADDING - 5}, ${PADDING + region.y * (CELL_H + GAP) + CELL_H / 2})`}
            >
              {region.name}
            </text>
          ))}

          {/* Municipios */}
          {MUNICIPIOS.map((mun) => {
            const count = getCount(mun.id);
            const color = getColorForCases(count, maxCount);
            const isHovered = hoveredMun === mun.id;
            const x = PADDING + mun.x * (CELL_W + GAP);
            const y = PADDING + mun.y * (CELL_H + GAP);

            return (
              <g
                key={mun.id}
                onMouseEnter={() => setHoveredMun(mun.id)}
                onMouseLeave={() => setHoveredMun(null)}
                style={{ cursor: "pointer" }}
              >
                <motion.rect
                  x={x}
                  y={y}
                  width={CELL_W}
                  height={CELL_H}
                  rx={8}
                  fill={color}
                  stroke={isHovered ? "#ef4444" : "#e2e8f0"}
                  strokeWidth={isHovered ? 2.5 : 1}
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: mun.y * 0.05 + mun.x * 0.03, duration: 0.3 }}
                  whileHover={{ scale: 1.03 }}
                />

                {/* Region indicator dot */}
                <circle
                  cx={x + 10}
                  cy={y + 12}
                  r={4}
                  fill={REGION_COLORS[mun.region]}
                  opacity={0.7}
                />

                {/* Municipio name */}
                <text
                  x={x + CELL_W / 2}
                  y={y + 30}
                  textAnchor="middle"
                  fontSize="11"
                  fontWeight="600"
                  fill={count > maxCount / 2 && count > 0 ? "#fff" : "#334155"}
                >
                  {mun.name}
                </text>

                {/* Capital */}
                <text
                  x={x + CELL_W / 2}
                  y={y + 46}
                  textAnchor="middle"
                  fontSize="8"
                  fill={count > maxCount / 2 && count > 0 ? "#e2e8f0" : "#64748b"}
                >
                  {mun.capital}
                </text>

                {/* Count */}
                <text
                  x={x + CELL_W / 2}
                  y={y + CELL_H - 15}
                  textAnchor="middle"
                  fontSize={count > 99 ? "18" : "22"}
                  fontWeight="bold"
                  fill={count > maxCount / 2 && count > 0 ? "#fff" : "#ef4444"}
                >
                  {count}
                </text>

                <text
                  x={x + CELL_W / 2}
                  y={y + CELL_H - 5}
                  textAnchor="middle"
                  fontSize="8"
                  fill={count > maxCount / 2 && count > 0 ? "#e2e8f0" : "#94a3b8"}
                >
                  {count === 1 ? "caso" : "casos"}
                </text>

                {/* Tooltip on hover */}
                {isHovered && (
                  <g>
                    <rect
                      x={x + CELL_W / 2 - 75}
                      y={y - 45}
                      width={150}
                      height={38}
                      rx={6}
                      fill="#1e293b"
                      opacity={0.95}
                    />
                    <text
                      x={x + CELL_W / 2}
                      y={y - 28}
                      textAnchor="middle"
                      fontSize="10"
                      fontWeight="600"
                      fill="#fff"
                    >
                      {mun.name}
                    </text>
                    <text
                      x={x + CELL_W / 2}
                      y={y - 14}
                      textAnchor="middle"
                      fontSize="9"
                      fill="#94a3b8"
                    >
                      {count} {count === 1 ? "caso" : "casos"} — Capital: {mun.capital}
                    </text>
                  </g>
                )}
              </g>
            );
          })}

          {/* Legend */}
          <g transform={`translate(${PADDING}, ${SVG_H - 35})`}>
            <text x="0" y="12" fontSize="9" fill="#94a3b8" fontWeight="500">
              Escala de casos:
            </text>
            {[0, 0.25, 0.5, 0.75, 1].map((t, i) => (
              <g key={i} transform={`translate(${80 + i * 60}, 0)`}>
                <rect width="40" height="14" rx="3" fill={getColorForCases(Math.round(t * maxCount), maxCount)} stroke="#e2e8f0" strokeWidth="0.5" />
                <text x="20" y="25" textAnchor="middle" fontSize="8" fill="#94a3b8">
                  {t === 0 ? "0" : t === 1 ? String(maxCount) : String(Math.round(t * maxCount))}
                </text>
              </g>
            ))}
          </g>
        </svg>
      </div>

      {/* Region legend */}
      <div className="flex flex-wrap justify-center gap-3 mt-3">
        {Object.entries(REGION_COLORS).map(([region, color]) => (
          <div key={region} className="flex items-center gap-1.5">
            <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: color }} />
            <span className="text-[10px] text-gray-500">{region}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
