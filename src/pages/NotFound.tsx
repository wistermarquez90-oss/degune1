import { Link } from "react-router";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Activity } from "lucide-react";

export default function NotFound() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white flex items-center justify-center p-4">
      <Card className="max-w-sm w-full border-0 shadow-xl">
        <CardContent className="pt-10 pb-10 text-center">
          <div className="w-16 h-16 bg-gray-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <Activity className="w-8 h-8 text-gray-400" />
          </div>
          <h1 className="text-4xl font-bold text-gray-900 mb-2">404</h1>
          <p className="text-sm text-gray-500 mb-6">Página no encontrada</p>
          <Link to="/">
            <Button className="bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 shadow-lg shadow-red-200">
              Volver al Inicio
            </Button>
          </Link>
        </CardContent>
      </Card>
    </div>
  );
}
