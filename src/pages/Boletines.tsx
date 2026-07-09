import { useState, useMemo } from "react";
import { trpc } from "@/providers/trpc";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Link } from "react-router";
import { motion } from "framer-motion";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import {
  Activity,
  Search,
  X,
  ChevronLeft,
  ChevronRight,
  Download,
  FileText,
  Filter,
  MapPin,
  User,
  Stethoscope,
  Calendar,
} from "lucide-react";
import * as XLSX from "xlsx";
import { saveAs } from "file-saver";

export default function Boletines() {
  const [semana, setSemana] = useState<string>("");
  const [sexo, setSexo] = useState<string>("");
  const [diagnostico, setDiagnostico] = useState<string>("");
  const [hospitalizado, setHospitalizado] = useState<string>("");
  const [parroquia, setParroquia] = useState<string>("");
  const [municipio, setMunicipio] = useState<string>("");
  const [searchNombre, setSearchNombre] = useState("");
  const [page, setPage] = useState(0);
  const pageSize = 50;

  const { data: filters } = trpc.dengue.filterOptions.useQuery();
  const { data: stats } = trpc.dengue.stats.useQuery();

  const { data: cases, isLoading } = trpc.dengue.list.useQuery({
    semana: semana || undefined,
    sexo: sexo as "M" | "F" | undefined,
    diagnostico: diagnostico as
      | "DENGUE SIN SIGNOS DE ALARMA"
      | "DENGUE CON SIGNOS DE ALARMA"
      | undefined,
    hospitalizado: hospitalizado as "SI" | "NO" | undefined,
    parroquia: parroquia || undefined,
    municipio: municipio || undefined,
    limit: pageSize,
    offset: page * pageSize,
  });

  const clearFilters = () => {
    setSemana("");
    setSexo("");
    setDiagnostico("");
    setHospitalizado("");
    setParroquia("");
    setMunicipio("");
    setSearchNombre("");
    setPage(0);
  };

  const filteredCases = useMemo(
    () =>
      cases?.filter((c) =>
        searchNombre
          ? c.nombresApellidos
              .toLowerCase()
              .includes(searchNombre.toLowerCase())
          : true
      ) || [],
    [cases, searchNombre]
  );

  const activeFiltersCount = [
    semana,
    sexo,
    diagnostico,
    hospitalizado,
    parroquia,
    municipio,
    searchNombre,
  ].filter(Boolean).length;

  const chartData =
    stats?.bySemana.map((s) => {
      const match = s.semana.match(/SEM\s+(\d+)/);
      return {
        semana: match ? `S${match[1]}` : s.semana,
        casos: s.count,
      };
    }) || [];

  const exportToExcel = () => {
    if (!filteredCases.length) return;
    const data = filteredCases.map((c, i) => ({
      N: page * pageSize + i + 1,
      Semana: c.semana,
      Fecha: c.fecha ? new Date(c.fecha).toLocaleDateString("es-VE") : "",
      "Nombres y Apellidos": c.nombresApellidos,
      Edad: c.edad,
      Sexo: c.sexo,
      Diagnostico: c.diagnostico,
      Hospitalizado: c.hospitalizado,
      Muestra: c.muestra,
      Direccion: c.direccion || "",
      Parroquia: c.parroquia,
      Municipio: c.municipio,
      "Reportado Por": c.reportadoPor,
    }));
    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Casos Dengue");
    const excelBuffer = XLSX.write(wb, { bookType: "xlsx", type: "array" });
    const blob = new Blob([excelBuffer], { type: "application/octet-stream" });
    saveAs(blob, `casos_dengue_${new Date().toISOString().split("T")[0]}.xlsx`);
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white">
      {/* Header */}
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
              <h1 className="text-lg font-bold text-gray-900 leading-tight">
                Boletines y Reportes
              </h1>
              <p className="text-xs text-gray-500">
                Consulta y filtra casos de dengue
              </p>
            </div>
          </Link>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={exportToExcel}
              disabled={!filteredCases.length}
              className="gap-2"
            >
              <Download className="w-4 h-4" />
              <span className="hidden sm:inline">Exportar Excel</span>
            </Button>
            <Link to="/">
              <Button variant="outline" size="sm" className="gap-2">
                <Activity className="w-4 h-4" />
                <span className="hidden sm:inline">Inicio</span>
              </Button>
            </Link>
          </div>
        </div>
      </motion.header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* Mini Chart */}
        {stats && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="mb-5"
          >
            <Card className="border-0 shadow-lg bg-white">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-semibold text-gray-700 flex items-center gap-2">
                  <FileText className="w-4 h-4 text-red-500" />
                  Tendencia de Casos por Semana Epidemiológica
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={180}>
                  <BarChart data={chartData} margin={{ top: 5, right: 10, left: -10, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                    <XAxis dataKey="semana" tick={{ fontSize: 11, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
                    <YAxis tick={{ fontSize: 11, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
                    <Tooltip
                      contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 40px rgba(0,0,0,0.1)' }}
                      formatter={(value: number) => [`${value} casos`, 'Casos']}
                    />
                    <Bar dataKey="casos" fill="#ef4444" radius={[6, 6, 0, 0]} barSize={24} />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </motion.div>
        )}

        {/* Filters */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="mb-5"
        >
          <Card className="border-0 shadow-lg bg-white">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm font-semibold text-gray-700 flex items-center gap-2">
                  <Filter className="w-4 h-4 text-blue-500" />
                  Filtros de Búsqueda
                </CardTitle>
                {activeFiltersCount > 0 && (
                  <Badge
                    variant="secondary"
                    className="bg-red-100 text-red-700 text-xs"
                  >
                    {activeFiltersCount} activo
                    {activeFiltersCount > 1 ? "s" : ""}
                  </Badge>
                )}
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-7 gap-3">
                <div>
                  <label className="text-xs font-medium text-gray-500 mb-1.5 flex items-center gap-1">
                    <Calendar className="w-3 h-3" /> Semana
                  </label>
                  <Select value={semana} onValueChange={setSemana}>
                    <SelectTrigger className="h-9 text-xs bg-gray-50 border-gray-200">
                      <SelectValue placeholder="Todas" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="">Todas</SelectItem>
                      {filters?.semanas.map((s) => (
                        <SelectItem key={s} value={s}>
                          {s}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <label className="text-xs font-medium text-gray-500 mb-1.5 flex items-center gap-1">
                    <User className="w-3 h-3" /> Sexo
                  </label>
                  <Select value={sexo} onValueChange={setSexo}>
                    <SelectTrigger className="h-9 text-xs bg-gray-50 border-gray-200">
                      <SelectValue placeholder="Todos" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="">Todos</SelectItem>
                      <SelectItem value="M">Masculino</SelectItem>
                      <SelectItem value="F">Femenino</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <label className="text-xs font-medium text-gray-500 mb-1.5 flex items-center gap-1">
                    <Stethoscope className="w-3 h-3" /> Diagnóstico
                  </label>
                  <Select value={diagnostico} onValueChange={setDiagnostico}>
                    <SelectTrigger className="h-9 text-xs bg-gray-50 border-gray-200">
                      <SelectValue placeholder="Todos" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="">Todos</SelectItem>
                      <SelectItem value="DENGUE SIN SIGNOS DE ALARMA">
                        Sin Signos de Alarma
                      </SelectItem>
                      <SelectItem value="DENGUE CON SIGNOS DE ALARMA">
                        Con Signos de Alarma
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <label className="text-xs font-medium text-gray-500 mb-1.5 flex items-center gap-1">
                    <Activity className="w-3 h-3" /> Hospitalizado
                  </label>
                  <Select
                    value={hospitalizado}
                    onValueChange={setHospitalizado}
                  >
                    <SelectTrigger className="h-9 text-xs bg-gray-50 border-gray-200">
                      <SelectValue placeholder="Todos" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="">Todos</SelectItem>
                      <SelectItem value="SI">Sí</SelectItem>
                      <SelectItem value="NO">No</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <label className="text-xs font-medium text-gray-500 mb-1.5 flex items-center gap-1">
                    <MapPin className="w-3 h-3" /> Municipio
                  </label>
                  <Select value={municipio} onValueChange={setMunicipio}>
                    <SelectTrigger className="h-9 text-xs bg-gray-50 border-gray-200">
                      <SelectValue placeholder="Todos" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="">Todos</SelectItem>
                      {filters?.municipios.map((m) => (
                        <SelectItem key={m} value={m}>
                          {m}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <label className="text-xs font-medium text-gray-500 mb-1.5 flex items-center gap-1">
                    <MapPin className="w-3 h-3" /> Parroquia
                  </label>
                  <Select value={parroquia} onValueChange={setParroquia}>
                    <SelectTrigger className="h-9 text-xs bg-gray-50 border-gray-200">
                      <SelectValue placeholder="Todas" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="">Todas</SelectItem>
                      {filters?.parroquias.map((p) => (
                        <SelectItem key={p} value={p}>
                          {p}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <label className="text-xs font-medium text-gray-500 mb-1.5 flex items-center gap-1">
                    <Search className="w-3 h-3" /> Nombre
                  </label>
                  <div className="relative">
                    <Input
                      placeholder="Buscar..."
                      value={searchNombre}
                      onChange={(e) => {
                        setSearchNombre(e.target.value);
                        setPage(0);
                      }}
                      className="h-9 text-xs bg-gray-50 border-gray-200 pr-8"
                    />
                    {searchNombre && (
                      <button
                        onClick={() => setSearchNombre("")}
                        className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    )}
                  </div>
                </div>
              </div>

              {activeFiltersCount > 0 && (
                <div className="mt-3 pt-3 border-t border-gray-100 flex justify-end">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={clearFilters}
                    className="text-xs text-gray-500 hover:text-red-600 gap-1"
                  >
                    <X className="w-3 h-3" />
                    Limpiar todos los filtros
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </motion.div>

        {/* Results */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.3 }}
        >
          <div className="flex items-center justify-between mb-3">
            <p className="text-sm text-gray-500">
              Mostrando{" "}
              <span className="font-semibold text-gray-700">
                {filteredCases.length}
              </span>{" "}
              resultado{filteredCases.length !== 1 ? "s" : ""}
            </p>
            <div className="flex items-center gap-2">
              <span className="text-xs text-gray-400">
                Página {page + 1}
              </span>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPage(Math.max(0, page - 1))}
                disabled={page === 0}
                className="h-8 w-8 p-0"
              >
                <ChevronLeft className="w-4 h-4" />
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPage(page + 1)}
                disabled={filteredCases.length < pageSize}
                className="h-8 w-8 p-0"
              >
                <ChevronRight className="w-4 h-4" />
              </Button>
            </div>
          </div>

          <Card className="border-0 shadow-lg bg-white overflow-hidden">
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="bg-gradient-to-r from-gray-50 to-white border-b border-gray-100">
                      <th className="px-3 py-3 text-left font-semibold text-gray-500 text-xs uppercase tracking-wider">
                        #
                      </th>
                      <th className="px-3 py-3 text-left font-semibold text-gray-500 text-xs uppercase tracking-wider">
                        Sem
                      </th>
                      <th className="px-3 py-3 text-left font-semibold text-gray-500 text-xs uppercase tracking-wider">
                        Fecha
                      </th>
                      <th className="px-3 py-3 text-left font-semibold text-gray-500 text-xs uppercase tracking-wider">
                        Nombres y Apellidos
                      </th>
                      <th className="px-3 py-3 text-center font-semibold text-gray-500 text-xs uppercase tracking-wider">
                        Ed
                      </th>
                      <th className="px-3 py-3 text-center font-semibold text-gray-500 text-xs uppercase tracking-wider">
                        Sex
                      </th>
                      <th className="px-3 py-3 text-left font-semibold text-gray-500 text-xs uppercase tracking-wider">
                        Dx
                      </th>
                      <th className="px-3 py-3 text-center font-semibold text-gray-500 text-xs uppercase tracking-wider">
                        H
                      </th>
                      <th className="px-3 py-3 text-center font-semibold text-gray-500 text-xs uppercase tracking-wider">
                        M
                      </th>
                      <th className="px-3 py-3 text-left font-semibold text-gray-500 text-xs uppercase tracking-wider hidden lg:table-cell">
                        Municipio
                      </th>
                      <th className="px-3 py-3 text-left font-semibold text-gray-500 text-xs uppercase tracking-wider hidden xl:table-cell">
                        Parroquia
                      </th>
                      <th className="px-3 py-3 text-left font-semibold text-gray-500 text-xs uppercase tracking-wider hidden 2xl:table-cell">
                        Reportado
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50">
                    {isLoading ? (
                      <tr>
                        <td colSpan={12} className="px-4 py-16 text-center">
                          <div className="flex flex-col items-center gap-3">
                            <div className="w-8 h-8 border-3 border-red-200 border-t-red-600 rounded-full animate-spin" />
                            <p className="text-sm text-gray-400">
                              Cargando casos...
                            </p>
                          </div>
                        </td>
                      </tr>
                    ) : filteredCases.length === 0 ? (
                      <tr>
                        <td
                          colSpan={12}
                          className="px-4 py-16 text-center text-gray-400"
                        >
                          <div className="flex flex-col items-center gap-2">
                            <Search className="w-8 h-8 text-gray-300" />
                            <p>
                              No se encontraron casos con los filtros
                              seleccionados
                            </p>
                            <Button
                              variant="link"
                              size="sm"
                              onClick={clearFilters}
                              className="text-red-600"
                            >
                              Limpiar filtros
                            </Button>
                          </div>
                        </td>
                      </tr>
                    ) : (
                      filteredCases.map((c, i) => (
                        <motion.tr
                          key={c.id}
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          transition={{ delay: Math.min(i * 0.01, 0.3) }}
                          className="hover:bg-red-50/30 transition-colors"
                        >
                          <td className="px-3 py-2.5 text-gray-400 font-mono text-xs">
                            {page * pageSize + i + 1}
                          </td>
                          <td className="px-3 py-2.5">
                            <Badge
                              variant="outline"
                              className="text-[10px] font-mono bg-gray-50"
                            >
                              {c.semana.replace("SEM ", "S")}
                            </Badge>
                          </td>
                          <td className="px-3 py-2.5 text-gray-500 text-xs whitespace-nowrap">
                            {c.fecha
                              ? new Date(c.fecha).toLocaleDateString("es-VE")
                              : "-"}
                          </td>
                          <td className="px-3 py-2.5 font-semibold text-gray-800 text-xs max-w-[180px] truncate">
                            {c.nombresApellidos}
                          </td>
                          <td className="px-3 py-2.5 text-center text-xs font-mono">
                            {c.edad}
                          </td>
                          <td className="px-3 py-2.5 text-center">
                            <Badge
                              className={
                                c.sexo === "M"
                                  ? "bg-blue-100 text-blue-700 text-[10px]"
                                  : "bg-pink-100 text-pink-700 text-[10px]"
                              }
                            >
                              {c.sexo}
                            </Badge>
                          </td>
                          <td className="px-3 py-2.5">
                            <Badge
                              className={
                                c.diagnostico ===
                                "DENGUE CON SIGNOS DE ALARMA"
                                  ? "bg-red-100 text-red-700 text-[10px]"
                                  : "bg-amber-100 text-amber-700 text-[10px]"
                              }
                            >
                              {c.diagnostico ===
                              "DENGUE CON SIGNOS DE ALARMA"
                                ? "ALARMA"
                                : "SIN ALARMA"}
                            </Badge>
                          </td>
                          <td className="px-3 py-2.5 text-center">
                            <Badge
                              className={
                                c.hospitalizado === "SI"
                                  ? "bg-red-100 text-red-700 text-[10px]"
                                  : "bg-gray-100 text-gray-500 text-[10px]"
                              }
                            >
                              {c.hospitalizado}
                            </Badge>
                          </td>
                          <td className="px-3 py-2.5 text-center">
                            <Badge
                              className={
                                c.muestra === "SI"
                                  ? "bg-green-100 text-green-700 text-[10px]"
                                  : "bg-gray-100 text-gray-500 text-[10px]"
                              }
                            >
                              {c.muestra}
                            </Badge>
                          </td>
                          <td className="px-3 py-2.5 text-gray-600 text-xs hidden lg:table-cell max-w-[120px] truncate">
                            {c.municipio}
                          </td>
                          <td className="px-3 py-2.5 text-gray-600 text-xs hidden xl:table-cell max-w-[120px] truncate">
                            {c.parroquia}
                          </td>
                          <td className="px-3 py-2.5 text-gray-400 text-[10px] hidden 2xl:table-cell max-w-[150px] truncate">
                            {c.reportadoPor}
                          </td>
                        </motion.tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Pagination Bottom */}
        <div className="flex items-center justify-center gap-3 mt-6">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setPage(Math.max(0, page - 1))}
            disabled={page === 0}
            className="gap-1"
          >
            <ChevronLeft className="w-4 h-4" />
            Anterior
          </Button>
          <span className="text-sm text-gray-500 font-medium">
            Página {page + 1}
          </span>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setPage(page + 1)}
            disabled={filteredCases.length < pageSize}
            className="gap-1"
          >
            Siguiente
            <ChevronRight className="w-4 h-4" />
          </Button>
        </div>
      </main>

      {/* Footer */}
      <footer className="bg-white border-t border-gray-100 mt-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 text-center">
          <p className="text-xs text-gray-400">
            Sistema de Vigilancia Epidemiológica del Dengue - Estado Mérida,
            Venezuela 2026
          </p>
        </div>
      </footer>
    </div>
  );
}
