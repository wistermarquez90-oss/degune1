import { useState } from "react";
import { trpc } from "@/providers/trpc";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Link } from "react-router";
import { motion } from "framer-motion";
import MeridaMap from "@/components/MeridaMap";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  AreaChart,
  Area,
} from "recharts";
import {
  Activity,
  Users,
  Hospital,
  AlertTriangle,
  FileText,
  Shield,
  TrendingUp,
  MapPin,
  CalendarDays,
} from "lucide-react";

const COLORS_SEXO = ["#3b82f6", "#ec4899"];
const COLORS_DIAG = ["#f59e0b", "#dc2626"];
const COLORS_MUN = ["#ef4444", "#f97316", "#eab308", "#22c55e", "#06b6d4", "#3b82f6", "#8b5cf6", "#ec4899", "#f43f5e", "#14b8a6"];

const fadeInUp = {
  hidden: { opacity: 0, y: 30 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { delay: i * 0.1, duration: 0.5, ease: "easeOut" as const },
  }),
};

export default function Home() {
  const [selectedSemana, setSelectedSemana] = useState<string | undefined>(undefined);

  const { data: stats } = trpc.dengue.stats.useQuery();
  const { data: allMunicipios } = trpc.dengue.allMunicipios.useQuery();
  const { data: casesByMunicipioSemana } = trpc.dengue.casesByMunicipioSemana.useQuery();
  const { data: filterOptions } = trpc.dengue.filterOptions.useQuery();

  const totalHosp = stats?.hospitalizados.find(h => h.hospitalizado === 'SI')?.count || 0;
  const totalConAlarma = stats?.byDiagnostico.find(d => d.diagnostico === 'DENGUE CON SIGNOS DE ALARMA')?.count || 0;
  const pctHosp = stats?.total ? ((totalHosp / stats.total) * 100).toFixed(1) : "0";
  const pctAlarma = stats?.total ? ((totalConAlarma / stats.total) * 100).toFixed(1) : "0";

  const pieSexoData = stats?.bySexo.map(s => ({
    name: s.sexo === 'M' ? 'Masculino' : 'Femenino',
    value: s.count,
  })) || [];

  const pieDiagData = stats?.byDiagnostico.map(d => ({
    name: d.diagnostico === 'DENGUE CON SIGNOS DE ALARMA' ? 'Con Signos de Alarma' : 'Sin Signos de Alarma',
    value: d.count,
  })) || [];

  const areaData = stats?.bySemana.map(s => {
    const match = s.semana.match(/SEM\s+(\d+)/);
    return {
      semana: match ? `S${match[1]}` : s.semana,
      casos: s.count,
    };
  }) || [];

  const mapData = selectedSemana
    ? (casesByMunicipioSemana
        ?.filter((d) => d.semana === selectedSemana)
        .map((d) => ({ municipio: d.municipio, count: d.count })) || [])
    : (allMunicipios?.map((d) => ({ municipio: d.municipio, count: d.count })) || []);

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white">
      <motion.header
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="bg-white/80 backdrop-blur-xl border-b border-gray-200/80 sticky top-0 z-50"
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-3 group">
            <div className="w-10 h-10 bg-gradient-to-br from-red-500 to-red-700 rounded-xl flex items-center justify-center shadow-lg shadow-red-200 group-hover:shadow-red-300 transition-shadow">
              <Activity className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="text-lg font-bold text-gray-900 leading-tight">Vigilancia Dengue</h1>
              <p className="text-xs text-gray-500">Estado Mérida, Venezuela - 2026</p>
            </div>
          </Link>
          <div className="flex items-center gap-2">
            <Link to="/boletines">
              <Button variant="outline" size="sm" className="gap-2 hover:bg-gray-50 transition-colors">
                <FileText className="w-4 h-4" />
                <span className="hidden sm:inline">Boletines</span>
              </Button>
            </Link>
            <Link to="/login">
              <Button size="sm" className="gap-2 bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 shadow-lg shadow-red-200 transition-all hover:shadow-red-300">
                <Shield className="w-4 h-4" />
                <span className="hidden sm:inline">Admin</span>
              </Button>
            </Link>
          </div>
        </div>
      </motion.header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {stats && (
          <>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 mb-8">
              {[
                {
                  label: "Total Casos",
                  value: stats.total,
                  sub: stats.bySemana.length + " semanas reportadas",
                  icon: Users,
                  color: "from-blue-500 to-blue-600",
                  iconBg: "bg-blue-50",
                  iconColor: "text-blue-600",
                },
                {
                  label: "Hospitalizados",
                  value: totalHosp,
                  sub: pctHosp + "% del total",
                  icon: Hospital,
                  color: "from-orange-500 to-orange-600",
                  iconBg: "bg-orange-50",
                  iconColor: "text-orange-600",
                },
                {
                  label: "Con Signos de Alarma",
                  value: totalConAlarma,
                  sub: pctAlarma + "% del total",
                  icon: AlertTriangle,
                  color: "from-red-500 to-red-600",
                  iconBg: "bg-red-50",
                  iconColor: "text-red-600",
                },
                {
                  label: "Semanas Activas",
                  value: stats.bySemana.length,
                  sub: "Epidemiológicas",
                  icon: TrendingUp,
                  color: "from-emerald-500 to-emerald-600",
                  iconBg: "bg-emerald-50",
                  iconColor: "text-emerald-600",
                },
              ].map((stat, i) => (
                <motion.div
                  key={stat.label}
                  custom={i}
                  initial="hidden"
                  animate="visible"
                  variants={fadeInUp}
                >
                  <Card className="border-0 shadow-lg hover:shadow-xl transition-shadow duration-300 bg-white overflow-hidden group">
                    <div className={"h-1 bg-gradient-to-r " + stat.color} />
                    <CardContent className="p-5">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <p className="text-xs font-medium text-gray-500 uppercase tracking-wider">{stat.label}</p>
                          <p className="text-3xl font-bold text-gray-900 mt-1">{stat.value}</p>
                          <p className="text-xs text-gray-400 mt-1">{stat.sub}</p>
                        </div>
                        <div className={stat.iconBg + " p-2.5 rounded-xl"}>
                          <stat.icon className={"w-5 h-5 " + stat.iconColor} />
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </div>

            <motion.div
              custom={4}
              initial="hidden"
              animate="visible"
              variants={fadeInUp}
              className="mb-5"
            >
              <Card className="border-0 shadow-lg bg-white">
                <CardHeader className="pb-2">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <CardTitle className="text-sm font-semibold text-gray-700 flex items-center gap-2">
                      <MapPin className="w-4 h-4 text-red-500" />
                      Mapa de Casos por Municipio
                    </CardTitle>
                    <div className="flex items-center gap-2">
                      <CalendarDays className="w-4 h-4 text-gray-400" />
                      <select
                        value={selectedSemana || "todas"}
                        onChange={(e) => setSelectedSemana(e.target.value === "todas" ? undefined : e.target.value)}
                        className="w-48 h-9 px-3 text-xs bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent cursor-pointer"
                      >
                        <option value="todas">Todas las semanas</option>
                        {filterOptions?.semanas.map((s) => (
                          <option key={s} value={s}>{s}</option>
                        ))}
                      </select>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <MeridaMap data={mapData} selectedSemana={selectedSemana} />
                </CardContent>
              </Card>
            </motion.div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-5 mb-5">
              <motion.div
                custom={5}
                initial="hidden"
                animate="visible"
                variants={fadeInUp}
                className="lg:col-span-2"
              >
                <Card className="border-0 shadow-lg bg-white">
                  <CardHeader className="pb-2">
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-sm font-semibold text-gray-700 flex items-center gap-2">
                        <TrendingUp className="w-4 h-4 text-red-500" />
                        Tendencia de Casos por Semana
                      </CardTitle>
                      <Badge variant="outline" className="text-xs font-mono">2026</Badge>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <ResponsiveContainer width="100%" height={280}>
                      <AreaChart data={areaData} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
                        <defs>
                          <linearGradient id="colorCasos" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#ef4444" stopOpacity={0.3} />
                            <stop offset="95%" stopColor="#ef4444" stopOpacity={0} />
                          </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                        <XAxis dataKey="semana" tick={{ fontSize: 11, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
                        <YAxis tick={{ fontSize: 11, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
                        <Tooltip
                          contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 40px rgba(0,0,0,0.1)' }}
                          formatter={(value: number) => [`${value} casos`, 'Casos']}
                        />
                        <Area type="monotone" dataKey="casos" stroke="#ef4444" strokeWidth={2.5} fillOpacity={1} fill="url(#colorCasos)" />
                      </AreaChart>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>
              </motion.div>

              <motion.div
                custom={6}
                initial="hidden"
                animate="visible"
                variants={fadeInUp}
              >
                <Card className="border-0 shadow-lg bg-white">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-semibold text-gray-700 flex items-center gap-2">
                      <Users className="w-4 h-4 text-blue-500" />
                      Distribución por Sexo
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ResponsiveContainer width="100%" height={280}>
                      <PieChart>
                        <Pie
                          data={pieSexoData}
                          cx="50%"
                          cy="50%"
                          innerRadius={60}
                          outerRadius={90}
                          paddingAngle={4}
                          dataKey="value"
                          nameKey="name"
                          strokeWidth={0}
                        >
                          {pieSexoData.map((_, index) => (
                            <Cell key={`cell-${index}`} fill={COLORS_SEXO[index]} />
                          ))}
                        </Pie>
                        <Tooltip
                          contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 40px rgba(0,0,0,0.1)' }}
                          formatter={(value: number, name: string) => [`${value} casos`, name]}
                        />
                      </PieChart>
                    </ResponsiveContainer>
                    <div className="flex justify-center gap-6 -mt-2">
                      {pieSexoData.map((entry, i) => (
                        <div key={entry.name} className="flex items-center gap-2">
                          <div className="w-3 h-3 rounded-full" style={{ backgroundColor: COLORS_SEXO[i] }} />
                          <span className="text-xs text-gray-600">{entry.name}</span>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-5 mb-5">
              <motion.div
                custom={7}
                initial="hidden"
                animate="visible"
                variants={fadeInUp}
              >
                <Card className="border-0 shadow-lg bg-white">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-semibold text-gray-700 flex items-center gap-2">
                      <AlertTriangle className="w-4 h-4 text-amber-500" />
                      Por Tipo de Diagnóstico
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ResponsiveContainer width="100%" height={260}>
                      <PieChart>
                        <Pie
                          data={pieDiagData}
                          cx="50%"
                          cy="50%"
                          innerRadius={50}
                          outerRadius={85}
                          paddingAngle={4}
                          dataKey="value"
                          nameKey="name"
                          strokeWidth={0}
                        >
                          {pieDiagData.map((_, index) => (
                            <Cell key={`cell-${index}`} fill={COLORS_DIAG[index]} />
                          ))}
                        </Pie>
                        <Tooltip
                          contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 40px rgba(0,0,0,0.1)' }}
                          formatter={(value: number, name: string) => [`${value} casos`, name]}
                        />
                      </PieChart>
                    </ResponsiveContainer>
                    <div className="flex justify-center gap-4 -mt-2 flex-wrap">
                      {pieDiagData.map((entry, i) => (
                        <div key={entry.name} className="flex items-center gap-2">
                          <div className="w-3 h-3 rounded-full" style={{ backgroundColor: COLORS_DIAG[i] }} />
                          <span className="text-xs text-gray-600">{entry.name}</span>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </motion.div>

              <motion.div
                custom={8}
                initial="hidden"
                animate="visible"
                variants={fadeInUp}
                className="lg:col-span-2"
              >
                <Card className="border-0 shadow-lg bg-white">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-semibold text-gray-700 flex items-center gap-2">
                      <MapPin className="w-4 h-4 text-emerald-500" />
                      Top 10 Municipios Afectados
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ResponsiveContainer width="100%" height={280}>
                      <BarChart data={stats.byMunicipio} layout="vertical" margin={{ top: 5, right: 30, left: 10, bottom: 5 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" horizontal={false} />
                        <XAxis type="number" tick={{ fontSize: 11, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
                        <YAxis dataKey="municipio" type="category" tick={{ fontSize: 10, fill: '#64748b' }} axisLine={false} tickLine={false} width={100} />
                        <Tooltip
                          contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 40px rgba(0,0,0,0.1)' }}
                          formatter={(value: number) => [`${value} casos`, 'Casos']}
                        />
                        <Bar dataKey="count" radius={[0, 6, 6, 0]} barSize={20}>
                          {stats.byMunicipio.map((_, index) => (
                            <Cell key={`cell-${index}`} fill={COLORS_MUN[index % COLORS_MUN.length]} />
                          ))}
                        </Bar>
                      </BarChart>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>
              </motion.div>
            </div>

            <motion.div
              custom={9}
              initial="hidden"
              animate="visible"
              variants={fadeInUp}
              className="mb-8"
            >
              <Card className="border-0 shadow-lg bg-white">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-semibold text-gray-700 flex items-center gap-2">
                    <MapPin className="w-4 h-4 text-violet-500" />
                    Top 10 Parroquias con Más Casos
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b border-gray-100">
                          <th className="px-4 py-3 text-left font-medium text-gray-500 text-xs uppercase tracking-wider">#</th>
                          <th className="px-4 py-3 text-left font-medium text-gray-500 text-xs uppercase tracking-wider">Parroquia</th>
                          <th className="px-4 py-3 text-right font-medium text-gray-500 text-xs uppercase tracking-wider">Casos</th>
                          <th className="px-4 py-3 text-right font-medium text-gray-500 text-xs uppercase tracking-wider">% del Total</th>
                          <th className="px-4 py-3 text-left font-medium text-gray-500 text-xs uppercase tracking-wider">Barra</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-50">
                        {stats.byParroquia.map((p, i) => {
                          const pct = stats.total > 0 ? (p.count / stats.total) * 100 : 0;
                          return (
                            <tr key={p.parroquia} className="hover:bg-gray-50/50 transition-colors">
                              <td className="px-4 py-3 text-gray-400 font-mono text-xs">{i + 1}</td>
                              <td className="px-4 py-3 font-semibold text-gray-800 text-sm">{p.parroquia}</td>
                              <td className="px-4 py-3 text-right">
                                <Badge variant="outline" className="font-mono text-xs bg-gray-50">{p.count}</Badge>
                              </td>
                              <td className="px-4 py-3 text-right text-gray-500 text-xs">{pct.toFixed(1)}%</td>
                              <td className="px-4 py-3 w-48">
                                <div className="w-full bg-gray-100 rounded-full h-2 overflow-hidden">
                                  <motion.div
                                    initial={{ width: 0 }}
                                    animate={{ width: `${pct}%` }}
                                    transition={{ delay: 0.5 + i * 0.05, duration: 0.8, ease: "easeOut" }}
                                    className="h-full rounded-full"
                                    style={{ backgroundColor: COLORS_MUN[i % COLORS_MUN.length] }}
                                  />
                                </div>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </CardContent>
              </Card>
            </motion.div>

            <motion.div
              custom={10}
              initial="hidden"
              animate="visible"
              variants={fadeInUp}
              className="text-center py-8"
            >
              <div className="bg-gradient-to-r from-red-50 via-white to-blue-50 rounded-2xl p-8 border border-gray-100">
                <h3 className="text-lg font-semibold text-gray-800 mb-2">¿Necesitas consultar los datos detallados?</h3>
                <p className="text-sm text-gray-500 mb-5">Accede a los boletines epidemiológicos con filtros avanzados y exportación de datos</p>
                <Link to="/boletines">
                  <Button size="lg" className="bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 shadow-lg shadow-red-200 transition-all hover:shadow-xl hover:shadow-red-300 hover:-translate-y-0.5 gap-2">
                    <FileText className="w-5 h-5" />
                    Ver Boletines y Reportes
                  </Button>
                </Link>
              </div>
            </motion.div>
          </>
        )}

        {!stats && (
          <div className="flex items-center justify-center h-96">
            <div className="flex flex-col items-center gap-4">
              <div className="w-12 h-12 border-4 border-red-200 border-t-red-600 rounded-full animate-spin" />
              <p className="text-sm text-gray-500">Cargando estadísticas...</p>
            </div>
          </div>
        )}
      </main>

      <footer className="bg-white border-t border-gray-100 mt-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 flex flex-col sm:flex-row items-center justify-between gap-2">
          <p className="text-xs text-gray-400">Sistema de Vigilancia Epidemiológica del Dengue - Estado Mérida, Venezuela 2026</p>
          <p className="text-xs text-gray-400">Datos actualizados por las unidades de salud regionales</p>
        </div>
      </footer>
    </div>
  );
}
