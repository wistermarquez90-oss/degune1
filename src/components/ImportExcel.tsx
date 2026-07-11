import { useState, useRef } from "react";
import { trpc } from "@/providers/trpc";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Upload, FileSpreadsheet, CheckCircle, AlertTriangle, X } from "lucide-react";

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

  return (
    <Card className="border-0 shadow-lg bg-white mb-6">
      <CardHeader className="pb-3">
        <CardTitle className="text-sm font-semibold text-gray-700 flex items-center gap-2">
          <FileSpreadsheet className="w-4 h-4 text-green-600" />
          Importar desde Excel
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Drop zone */}
        <div
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          onClick={() => fileInputRef.current?.click()}
          className={`
            border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-all
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
          <Upload className={`w-8 h-8 mx-auto mb-2 ${file ? "text-green-600" : "text-gray-400"}`} />
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

        {/* Format info */}
        <div className="bg-blue-50 rounded-lg p-3 border border-blue-100">
          <p className="text-xs text-blue-700 font-medium mb-1">
            Formato esperado del Excel:
          </p>
          <ul className="text-xs text-blue-600 space-y-0.5 list-disc list-inside">
            <li>Columna A: Nº (número de fila, opcional)</li>
            <li>Columna B: SEM (ej: SEM 1)</li>
            <li>Columna C: Fecha (formato fecha)</li>
            <li>Columna D: Nombres y Apellidos</li>
            <li>Columna E: M (edad si es masculino)</li>
            <li>Columna F: F (edad si es femenino)</li>
            <li>Columna G: H (SI/NO hospitalizado)</li>
            <li>Columna H: Diagnóstico</li>
            <li>Columna I: MU (SI/NO muestra)</li>
            <li>Columna J: Dirección</li>
            <li>Columna K: Parroquia</li>
            <li>Columna L: Municipio</li>
            <li>Columna M: Reportado por</li>
          </ul>
        </div>

        {/* Import button */}
        {file && (
          <Button
            onClick={handleImport}
            disabled={importMutation.isPending}
            className="w-full bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 shadow-lg shadow-green-200 transition-all hover:shadow-xl hover:shadow-green-300 hover:-translate-y-0.5 gap-2"
          >
            {importMutation.isPending ? (
              <>
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                Importando...
              </>
            ) : (
              <>
                <Upload className="w-4 h-4" />
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
  );
}
