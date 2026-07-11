import { useState, useEffect } from "react";
import { trpc } from "@/providers/trpc";
import { useAuth } from "@/hooks/useAuth";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Link, useNavigate } from "react-router";
import { motion, AnimatePresence } from "framer-motion";
import {
  Activity,
  Plus,
  Search,
  Pencil,
  Trash2,
  X,
  ChevronLeft,
  ChevronRight,
  Shield,
  LogOut,
  Save,
  AlertTriangle,
  Upload,
} from "lucide-react";

const SEMANAS = Array.from({ length: 52 }, (_, i) => `SEM ${i + 1}`);

const emptyForm = {
  semana: "",
  fecha: "",
  nombresApellidos: "",
  edad: "",
  sexo: "M" as "M" | "F",
  hospitalizado: "NO" as "SI" | "NO",
  diagnostico: "DENGUE SIN SIGNOS DE ALARMA" as
    | "DENGUE SIN SIGNOS DE ALARMA"
    | "DENGUE CON SIGNOS DE ALARMA",
  muestra: "NO" as "SI" | "NO",
  direccion: "",
  parroquia: "",
  municipio: "",
  reportadoPor: "",
};

export default function Admin() {
  const navigate = useNavigate();
  const { user, isLoading: authLoading, isAdmin, logout } = useAuth();
  const utils = trpc.useUtils();

  const [form, setForm] = useState({ ...emptyForm });
  const [editingId, setEditingId] = useState<number | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [page, setPage] = useState(0);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState<number | null>(null);
  const [selectedIds, setSelectedIds] = useState<Set<number>>(new Set());
  const [deleteManyConfirm, setDeleteManyConfirm] = useState(false);
  const pageSize = 15;

  useEffect(() => {
    if (!authLoading && !isAdmin) {
      navigate("/login");
    }
  }, [authLoading, isAdmin, navigate]);

  const { data: cases, isLoading: casesLoading } = trpc.dengue.list.useQuery(
    { limit: pageSize, offset: page * pageSize },
    { enabled: isAdmin }
  );

  const createMutation = trpc.dengue.create.useMutation({
    onSuccess: () => {
      utils.dengue.list.invalidate();
      utils.dengue.stats.invalidate();
      utils.dengue.filterOptions.invalidate();
      setForm({ ...emptyForm });
      setDialogOpen(false);
    },
  });

  const updateMutation = trpc.dengue.update.useMutation({
    onSuccess: () => {
      utils.dengue.list.invalidate();
      utils.dengue.stats.invalidate();
      utils.dengue.filterOptions.invalidate();
      setForm({ ...emptyForm });
      setEditingId(null);
      setDialogOpen(false);
    },
  });

  const deleteMutation = trpc.dengue.delete.useMutation({
    onSuccess: () => {
      utils.dengue.list.invalidate();
      utils.dengue.stats.invalidate();
      utils.dengue.filterOptions.invalidate();
      setDeleteConfirm(null);
    },
  });

  const deleteManyMutation = trpc.dengue.deleteMany.useMutation({
    onSuccess: () => {
      utils.dengue.list.invalidate();
      utils.dengue.stats.invalidate();
      utils.dengue.filterOptions.invalidate();
      setSelectedIds(new Set());
      setDeleteManyConfirm(false);
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (
      !form.semana ||
      !form.fecha ||
      !form.nombresApellidos ||
      !form.edad ||
      !form.parroquia ||
      !form.municipio ||
      !form.reportadoPor
    )
      return;

    const data = {
      semana: form.semana,
      fecha: form.fecha,
      nombresApellidos: form.nombresApellidos,
      edad: parseInt(form.edad),
      sexo: form.sexo,
      hospitalizado: form.hospitalizado,
      diagnostico: form.diagnostico,
      muestra: form.muestra,
      direccion: form.direccion || undefined,
      parroquia: form.parroquia,
      municipio: form.municipio,
      reportadoPor: form.reportadoPor,
    };

    if (editingId) {
      updateMutation.mutate({ id: editingId, ...data });
    } else {
      createMutation.mutate(data);
    }
  };

  const handleEdit = (c: NonNullable<typeof cases>[0]) => {
    setEditingId(c.id);
    setForm({
      semana: c.semana,
      fecha: c.fecha ? new Date(c.fecha).toISOString().split("T")[0] : "",
      nombresApellidos: c.nombresApellidos,
      edad: String(c.edad),
      sexo: c.sexo as "M" | "F",
      hospitalizado: c.hospitalizado as "SI" | "NO",
      diagnostico: c.diagnostico as
        | "DENGUE SIN SIGNOS DE ALARMA"
        | "DENGUE CON SIGNOS DE ALARMA",
      muestra: c.muestra as "SI" | "NO",
      direccion: c.direccion || "",
      parroquia: c.parroquia,
      municipio: c.municipio,
      reportadoPor: c.reportadoPor,
    });
    setDialogOpen(true);
  };

  const handleNew = () => {
    setEditingId(null);
    setForm({ ...emptyForm });
    setDialogOpen(true);
  };

  const handleDelete = (id: number) => {
    setDeleteConfirm(id);
  };

  const confirmDelete = () => {
    if (deleteConfirm !== null) {
      deleteMutation.mutate({ id: deleteConfirm });
    }
  };

  const toggleSelection = (id: number) => {
    const newSet = new Set(selectedIds);
    if (newSet.has(id)) {
      newSet.delete(id);
    } else {
      newSet.add(id);
    }
    setSelectedIds(newSet);
  };

  const toggleAllSelection = () => {
    if (selectedIds.size === filteredCases.length && filteredCases.length > 0) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(filteredCases.map((c) => c.id)));
    }
  };

  const handleDeleteMany = () => {
    if (selectedIds.size > 0) {
      setDeleteManyConfirm(true);
    }
  };

  const confirmDeleteMany = () => {
    if (selectedIds.size > 0) {
      deleteManyMutation.mutate({ ids: Array.from(selectedIds) });
    }
  };

  const filteredCases =
    cases?.filter(
      (c) =>
        !searchTerm ||
        c.nombresApellidos
          .toLowerCase()
          .includes(searchTerm.toLowerCase()) ||
        c.parroquia.toLowerCase().includes(searchTerm.toLowerCase()) ||
        c.municipio.toLowerCase().includes(searchTerm.toLowerCase())
    ) || [];

  if (authLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="w-12 h-12 border-4 border-red-200 border-t-red-600 rounded-full animate-spin" />
      </div>
    );
  }

  if (!isAdmin) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Card className="max-w-sm w-full mx-4 border-0 shadow-xl">
          <CardContent className="pt-8 pb-8 text-center">
            <div className="w-16 h-16 bg-red-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <Shield className="w-8 h-8 text-red-600" />
            </div>
            <h2 className="text-xl font-bold text-gray-900 mb-2">
              Acceso Restringido
            </h2>
            <p className="text-sm text-gray-500 mb-5">
              Necesitas iniciar sesión como administrador.
            </p>
            <Link to="/login">
              <Button className="bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 shadow-lg shadow-red-200">
                Iniciar Sesión
              </Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    );
  }

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
                Panel Administrativo
              </h1>
              <p className="text-xs text-gray-500">Gestión de casos de dengue</p>
            </div>
          </Link>
          <div className="flex items-center gap-2">
            <Badge
              variant="outline"
              className="bg-green-50 text-green-700 border-green-200 gap-1"
            >
              <Shield className="w-3 h-3" />
              {user?.name || "Admin"}
            </Badge>
            <Link to="/">
              <Button variant="outline" size="sm" className="gap-1">
                <Activity className="w-4 h-4" />
                <span className="hidden sm:inline">Inicio</span>
              </Button>
            </Link>
            <Button
              variant="outline"
              size="sm"
              onClick={logout}
              className="gap-1 text-red-600 hover:text-red-700 hover:bg-red-50"
            >
              <LogOut className="w-4 h-4" />
              <span className="hidden sm:inline">Salir</span>
            </Button>
          </div>
        </div>
      </motion.header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* Actions Bar */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
          className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-5"
        >
          <div className="relative flex-1 w-full sm:max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <Input
              placeholder="Buscar por nombre, parroquia o municipio..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-9 h-10 bg-white border-gray-200"
            />
            {searchTerm && (
              <button
                onClick={() => setSearchTerm("")}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>
          <Link to="/import">
            <Button
              className="bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 shadow-lg shadow-green-200 transition-all hover:shadow-xl hover:shadow-green-300 hover:-translate-y-0.5 gap-2"
            >
              <Upload className="w-4 h-4" />
              Importar
            </Button>
          </Link>
          <Button
            onClick={handleNew}
            className="bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 shadow-lg shadow-red-200 transition-all hover:shadow-xl hover:shadow-red-300 hover:-translate-y-0.5 gap-2"
          >
            <Plus className="w-4 h-4" />
            Nuevo Caso
          </Button>
        </motion.div>

        {selectedIds.size > 0 && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="flex items-center gap-3 mb-4 px-4 py-3 bg-red-50 border border-red-200 rounded-lg"
          >
            <span className="text-sm text-red-700 font-medium">
              {selectedIds.size} {selectedIds.size === 1 ? "caso seleccionado" : "casos seleccionados"}
            </span>
            <Button
              onClick={handleDeleteMany}
              className="bg-red-600 hover:bg-red-700 text-white text-xs h-8 gap-1"
            >
              <Trash2 className="w-3.5 h-3.5" />
              Eliminar seleccionados
            </Button>
          </motion.div>
        )}

        {/* Table */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
        >
          <Card className="border-0 shadow-lg bg-white overflow-hidden">
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="bg-gradient-to-r from-gray-50 to-white border-b border-gray-100">
                      <th className="px-3 py-3 text-center font-semibold text-gray-500 text-xs uppercase tracking-wider">
                        <input
                          type="checkbox"
                          checked={selectedIds.size > 0 && selectedIds.size === filteredCases.length}
                          onChange={toggleAllSelection}
                          className="w-4 h-4 rounded border-gray-300 text-red-600 focus:ring-red-500"
                        />
                      </th>
                      <th className="px-3 py-3 text-left font-semibold text-gray-500 text-xs uppercase tracking-wider">
                        ID
                      </th>
                      <th className="px-3 py-3 text-left font-semibold text-gray-500 text-xs uppercase tracking-wider">
                        Sem
                      </th>
                      <th className="px-3 py-3 text-left font-semibold text-gray-500 text-xs uppercase tracking-wider">
                        Fecha
                      </th>
                      <th className="px-3 py-3 text-left font-semibold text-gray-500 text-xs uppercase tracking-wider">
                        Nombres
                      </th>
                      <th className="px-3 py-3 text-center font-semibold text-gray-500 text-xs uppercase tracking-wider">
                        Ed
                      </th>
                      <th className="px-3 py-3 text-center font-semibold text-gray-500 text-xs uppercase tracking-wider">
                        Sx
                      </th>
                      <th className="px-3 py-3 text-left font-semibold text-gray-500 text-xs uppercase tracking-wider">
                        Dx
                      </th>
                      <th className="px-3 py-3 text-center font-semibold text-gray-500 text-xs uppercase tracking-wider">
                        H
                      </th>
                      <th className="px-3 py-3 text-left font-semibold text-gray-500 text-xs uppercase tracking-wider hidden md:table-cell">
                        Mun
                      </th>
                      <th className="px-3 py-3 text-left font-semibold text-gray-500 text-xs uppercase tracking-wider hidden lg:table-cell">
                        Parroq
                      </th>
                      <th className="px-3 py-3 text-center font-semibold text-gray-500 text-xs uppercase tracking-wider">
                        Acc
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50">
                    {casesLoading ? (
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
                          No se encontraron casos
                        </td>
                      </tr>
                    ) : (
                      filteredCases.map((c) => (
                        <motion.tr
                          key={c.id}
                          layout
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          exit={{ opacity: 0 }}
                          className="hover:bg-red-50/30 transition-colors group"
                        >
                          <td className="px-3 py-2.5 text-center">
                            <input
                              type="checkbox"
                              checked={selectedIds.has(c.id)}
                              onChange={() => toggleSelection(c.id)}
                              className="w-4 h-4 rounded border-gray-300 text-red-600 focus:ring-red-500"
                            />
                          </td>
                          <td className="px-3 py-2.5 text-gray-400 font-mono text-[10px]">
                            {c.id}
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
                          <td className="px-3 py-2.5 font-semibold text-gray-800 text-xs max-w-[160px] truncate">
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
                          <td className="px-3 py-2.5 text-gray-600 text-xs hidden md:table-cell max-w-[100px] truncate">
                            {c.municipio}
                          </td>
                          <td className="px-3 py-2.5 text-gray-600 text-xs hidden lg:table-cell max-w-[100px] truncate">
                            {c.parroquia}
                          </td>
                          <td className="px-3 py-2.5">
                            <div className="flex items-center justify-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleEdit(c)}
                                className="h-7 w-7 p-0 text-blue-600 hover:text-blue-700 hover:bg-blue-50"
                              >
                                <Pencil className="w-3.5 h-3.5" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleDelete(c.id)}
                                className="h-7 w-7 p-0 text-red-600 hover:text-red-700 hover:bg-red-50"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </Button>
                            </div>
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

        {/* Pagination */}
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

      {/* Create/Edit Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto border-0 shadow-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-lg">
              {editingId ? (
                <>
                  <Pencil className="w-5 h-5 text-blue-500" />
                  Editar Caso #{editingId}
                </>
              ) : (
                <>
                  <Plus className="w-5 h-5 text-red-500" />
                  Registrar Nuevo Caso
                </>
              )}
            </DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4 mt-2">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <Label className="text-xs font-medium text-gray-600">
                  Semana Epidemiológica *
                </Label>
                <Select
                  value={form.semana}
                  onValueChange={(v) =>
                    setForm({ ...form, semana: v })
                  }
                >
                  <SelectTrigger className="mt-1.5 h-10 bg-gray-50">
                    <SelectValue placeholder="Seleccionar..." />
                  </SelectTrigger>
                  <SelectContent>
                    {SEMANAS.map((s) => (
                      <SelectItem key={s} value={s}>
                        {s}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label className="text-xs font-medium text-gray-600">
                  Fecha *
                </Label>
                <Input
                  type="date"
                  value={form.fecha}
                  onChange={(e) =>
                    setForm({ ...form, fecha: e.target.value })
                  }
                  className="mt-1.5 h-10 bg-gray-50"
                  required
                />
              </div>
              <div className="sm:col-span-2">
                <Label className="text-xs font-medium text-gray-600">
                  Nombres y Apellidos *
                </Label>
                <Input
                  value={form.nombresApellidos}
                  onChange={(e) =>
                    setForm({ ...form, nombresApellidos: e.target.value })
                  }
                  placeholder="Nombre completo del paciente"
                  className="mt-1.5 h-10 bg-gray-50"
                  required
                />
              </div>
              <div>
                <Label className="text-xs font-medium text-gray-600">
                  Edad *
                </Label>
                <Input
                  type="number"
                  min={0}
                  max={150}
                  value={form.edad}
                  onChange={(e) =>
                    setForm({ ...form, edad: e.target.value })
                  }
                  className="mt-1.5 h-10 bg-gray-50"
                  required
                />
              </div>
              <div>
                <Label className="text-xs font-medium text-gray-600">
                  Sexo *
                </Label>
                <Select
                  value={form.sexo}
                  onValueChange={(v) =>
                    setForm({ ...form, sexo: v as "M" | "F" })
                  }
                >
                  <SelectTrigger className="mt-1.5 h-10 bg-gray-50">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="M">Masculino</SelectItem>
                    <SelectItem value="F">Femenino</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label className="text-xs font-medium text-gray-600">
                  Diagnóstico *
                </Label>
                <Select
                  value={form.diagnostico}
                  onValueChange={(v) =>
                    setForm({
                      ...form,
                      diagnostico: v as
                        | "DENGUE SIN SIGNOS DE ALARMA"
                        | "DENGUE CON SIGNOS DE ALARMA",
                    })
                  }
                >
                  <SelectTrigger className="mt-1.5 h-10 bg-gray-50">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
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
                <Label className="text-xs font-medium text-gray-600">
                  Hospitalizado *
                </Label>
                <Select
                  value={form.hospitalizado}
                  onValueChange={(v) =>
                    setForm({ ...form, hospitalizado: v as "SI" | "NO" })
                  }
                >
                  <SelectTrigger className="mt-1.5 h-10 bg-gray-50">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="SI">Sí</SelectItem>
                    <SelectItem value="NO">No</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label className="text-xs font-medium text-gray-600">
                  Muestra *
                </Label>
                <Select
                  value={form.muestra}
                  onValueChange={(v) =>
                    setForm({ ...form, muestra: v as "SI" | "NO" })
                  }
                >
                  <SelectTrigger className="mt-1.5 h-10 bg-gray-50">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="SI">Sí</SelectItem>
                    <SelectItem value="NO">No</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label className="text-xs font-medium text-gray-600">
                  Dirección
                </Label>
                <Input
                  value={form.direccion}
                  onChange={(e) =>
                    setForm({ ...form, direccion: e.target.value })
                  }
                  placeholder="Dirección del paciente"
                  className="mt-1.5 h-10 bg-gray-50"
                />
              </div>
              <div>
                <Label className="text-xs font-medium text-gray-600">
                  Municipio *
                </Label>
                <Input
                  value={form.municipio}
                  onChange={(e) =>
                    setForm({ ...form, municipio: e.target.value })
                  }
                  placeholder="Municipio"
                  className="mt-1.5 h-10 bg-gray-50"
                  required
                />
              </div>
              <div>
                <Label className="text-xs font-medium text-gray-600">
                  Parroquia *
                </Label>
                <Input
                  value={form.parroquia}
                  onChange={(e) =>
                    setForm({ ...form, parroquia: e.target.value })
                  }
                  placeholder="Parroquia"
                  className="mt-1.5 h-10 bg-gray-50"
                  required
                />
              </div>
              <div className="sm:col-span-2">
                <Label className="text-xs font-medium text-gray-600">
                  Reportado Por *
                </Label>
                <Input
                  value={form.reportadoPor}
                  onChange={(e) =>
                    setForm({ ...form, reportadoPor: e.target.value })
                  }
                  placeholder="Institución o persona que reporta"
                  className="mt-1.5 h-10 bg-gray-50"
                  required
                />
              </div>
            </div>
            <div className="flex justify-end gap-3 pt-4 border-t border-gray-100">
              <Button
                type="button"
                variant="outline"
                onClick={() => setDialogOpen(false)}
              >
                Cancelar
              </Button>
              <Button
                type="submit"
                disabled={
                  createMutation.isPending || updateMutation.isPending
                }
                className="bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 shadow-lg shadow-red-200 gap-2"
              >
                {createMutation.isPending || updateMutation.isPending ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    Guardando...
                  </>
                ) : (
                  <>
                    <Save className="w-4 h-4" />
                    {editingId ? "Actualizar" : "Guardar"}
                  </>
                )}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <AnimatePresence>
        {deleteConfirm !== null && (
          <Dialog open={deleteConfirm !== null} onOpenChange={() => setDeleteConfirm(null)}>
            <DialogContent className="max-w-sm border-0 shadow-2xl">
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2 text-lg">
                  <AlertTriangle className="w-5 h-5 text-red-500" />
                  Confirmar Eliminación
                </DialogTitle>
              </DialogHeader>
              <div className="py-4">
                <p className="text-sm text-gray-600">
                  ¿Estás seguro de que deseas eliminar este caso? Esta acción no
                  se puede deshacer.
                </p>
              </div>
              <div className="flex justify-end gap-3">
                <Button
                  variant="outline"
                  onClick={() => setDeleteConfirm(null)}
                >
                  Cancelar
                </Button>
                <Button
                  onClick={confirmDelete}
                  disabled={deleteMutation.isPending}
                  className="bg-red-600 hover:bg-red-700 gap-2"
                >
                  {deleteMutation.isPending ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      Eliminando...
                    </>
                  ) : (
                    <>
                      <Trash2 className="w-4 h-4" />
                      Eliminar
                    </>
                  )}
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        )}
      </AnimatePresence>

      {/* Delete Many Confirmation Dialog */}
      <AnimatePresence>
        {deleteManyConfirm && (
          <Dialog open={deleteManyConfirm} onOpenChange={() => setDeleteManyConfirm(false)}>
            <DialogContent className="max-w-sm border-0 shadow-2xl">
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2 text-lg">
                  <AlertTriangle className="w-5 h-5 text-red-500" />
                  Confirmar Eliminación Masiva
                </DialogTitle>
              </DialogHeader>
              <div className="py-4">
                <p className="text-sm text-gray-600">
                  ¿Estás seguro de que deseas eliminar <strong>{selectedIds.size}</strong> {selectedIds.size === 1 ? "caso" : "casos"}? Esta acción no se puede deshacer.
                </p>
              </div>
              <div className="flex justify-end gap-3">
                <Button
                  variant="outline"
                  onClick={() => setDeleteManyConfirm(false)}
                >
                  Cancelar
                </Button>
                <Button
                  onClick={confirmDeleteMany}
                  disabled={deleteManyMutation.isPending}
                  className="bg-red-600 hover:bg-red-700 gap-2"
                >
                  {deleteManyMutation.isPending ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      Eliminando...
                    </>
                  ) : (
                    <>
                      <Trash2 className="w-4 h-4" />
                      Eliminar {selectedIds.size}
                    </>
                  )}
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        )}
      </AnimatePresence>
    </div>
  );
}
