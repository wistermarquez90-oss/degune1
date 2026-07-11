import { useState, useRef } from "react";
import { trpc } from "@/providers/trpc";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Upload, FileSpreadsheet, CheckCircle, AlertTriangle, X, ArrowLeft, Download } from "lucide-react";
import { Link } from "react-router";
import * as XLSX from "xlsx";

export default function ImportExcel() {
  const [file, setFile] = useState<File | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [result, setResult] = useState<{
    success: boolean;
    inserted?: number;
    totalRows?: number;
    errors?: string[];
    error?: string;
  } | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const importMutation = trpc.import.importExcel.useMutation({
    onSuccess: (data) => {
      setResult(data);
      if (data.success) {
        setFile(null);
      }
    },
    onError: (err) => {
      setResult({ success: false, error: err.message });
    },
  });

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selected = e.target.files?.[0];
    if (selected && (selected.name.endsWith(".xlsx") || selected.name.endsWith(".xls"))) {
      setFile(selected);
      setResult(null);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const dropped = e.dataTransfer.files?.[0];
    if (dropped && (dropped.name.endsWith(".xlsx") || dropped.name.endsWith(".xls"))) {
      setFile(dropped);
      setResult(null);
    }
  };

  const handleImport = async () => {
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (e) => {
      const arrayBuffer = e.target?.result as ArrayBuffer;
      const base64 = btoa(
        new Uint8Array(arrayBuffer).reduce(
          (data, byte) => data + String.fromCharCode(byte),
          ""
        )
      );
      importMutation.mutate({ fileBase64: base64 });
    };
    reader.readAsArrayBuffer(file);
  };

  const clearFile = () => {
    setFile(null);
    setResult(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const downloadTemplate = () => {
    const headers = [
      "Nº",
      "SEM",
      "Fecha",
      "Nombres y Apellidos",
      "M",
      "F",
      "H",
      "Diagnóstico",
      "MU",
      "Dirección",
      "Parroquia",
      "Municipio",
      "Reportado por",
    ];
    const exampleRow = [
      1,
      "SEM 1",
      "2026-01-03",
      "EJEMPLO NOMBRE",
      "",
      54,
      "NO",
      "DENGUE SIN SIGNOS DE ALARMA",
      "NO",
      "GUACHIZON",
      "CARACCIOLO PARRA OLMEDO",
      "CARACCIOLO PARRA OLMEDO",
      "HOSP. TUCANI",
    ];
    const ws = XLSX.utils.aoa_to_sheet([headers, exampleRow]);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "BASE DENGUE 2026");
    XLSX.writeFile(wb, "plantilla_dengue_2026.xlsx");
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white py-8 px-4">
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="flex items-center gap-3 mb-6">
          <Link to="/admin">
            <Button variant="ghost" size="sm" className="gap-2">
              <ArrowLeft className="w-4 h-4" />
              Volver al panel
            </Button>
          </Link>
        </div>

        <Card className="border-0 shadow-lg bg-white">
          <CardHeader className="pb-3">
            <CardTitle className="text-lg font-semibold text-gray-800 flex items-center gap-2">
              <FileSpreadsheet className="w-5 h-5 text-green-600" />
              Importar Casos desde Excel
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Download template */}
            <div className="bg-green-50 rounded-lg p-4 border border-green-200 flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-green-800">
                  ¿No tienes el formato?
                </p>
                <p className="text-xs text-green-600 mt-0.5">
                  Descarga la plantilla con el formato correcto
                </p>
              </div>
              <Button
                onClick={downloadTemplate}
                variant="outline"
                className="border-green-300 text-green-700 hover:bg-green-100 gap-2"
              >
                <Download className="w-4 h-4" />
                Descargar plantilla
              </Button>
            </div>

            {/* Drop zone */}
            <div
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
              className={`
                border-2 border-dashed rounded-xl p-10 text-center cursor-pointer transition-all
                ${isDragging
                  ? "border-green-500 bg-green-50"
                  : "border-gray-200 hover:border-gray-300 hover:bg-gray-50"
                }
                ${file ? "bg-green-50 border-green-300" : ""}
              `}
            >
              <input
                ref={fileInputRef}
                type="file"
                accept=".xlsx,.xls"
                onChange={handleFileChange}
                className="hidden"
              />
              <Upload className={`w-10 h-10 mx-auto mb-3 ${file ? "text-green-600" : "text-gray-400"}`} />
              {file ? (
                <div className="flex items-center justify-center gap-2">
                  <span className="text-sm font-medium text-green-700">{file.name}</span>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      clearFile();
                    }}
                    className="text-gray-400 hover:text-red-500"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              ) : (
                <>
                  <p className="text-sm text-gray-600 font-medium">
                    Arrastra tu archivo Excel aquí o haz clic para seleccionar
                  </p>
                  <p className="text-xs text-gray-400 mt-1">
                    Formatos soportados: .xlsx, .xls
                  </p>
                </>
              )}
            </div>

            {/* Import button */}
            {file && (
              <Button
                onClick={handleImport}
                disabled={importMutation.isPending}
                className="w-full bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 shadow-lg shadow-green-200 transition-all hover:shadow-xl hover:shadow-green-300 hover:-translate-y-0.5 gap-2 h-12 text-base"
              >
                {importMutation.isPending ? (
                  <>
                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    Importando...
                  </>
                ) : (
                  <>
                    <Upload className="w-5 h-5" />
                    Importar {file.name}
                  </>
                )}
              </Button>
            )}

            {/* Result */}
            {result && (
              <div
                className={`rounded-lg p-4 border ${
                  result.success
                    ? "bg-green-50 border-green-200"
                    : "bg-red-50 border-red-200"
                }`}
              >
                <div className="flex items-center gap-2 mb-2">
                  {result.success ? (
                    <>
                      <CheckCircle className="w-5 h-5 text-green-600" />
                      <span className="font-semibold text-green-800">
                        ¡Importación exitosa!
                      </span>
                    </>
                  ) : (
                    <>
                      <AlertTriangle className="w-5 h-5 text-red-600" />
                      <span className="font-semibold text-red-800">
                        Error en la importación
                      </span>
                    </>
                  )}
                </div>

                {result.success && (
                  <div className="text-sm text-green-700 space-y-1">
                    <p>
                      <span className="font-semibold">{result.inserted}</span> casos importados
                      de <span className="font-semibold">{result.totalRows}</span> filas procesadas
                    </p>
                  </div>
                )}

                {!result.success && result.error && (
                  <p className="text-sm text-red-700">{result.error}</p>
                )}

                {result.errors && result.errors.length > 0 && (
                  <div className="mt-2">
                    <p className="text-xs font-semibold text-red-600 mb-1">
                      Errores (primeros 10):
                    </p>
                    <ul className="text-xs text-red-600 space-y-0.5 list-disc list-inside">
                      {result.errors.map((err, i) => (
                        <li key={i}>{err}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
