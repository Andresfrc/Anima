"use client";

import { motion } from "framer-motion";
import { AlertCircle, RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="flex h-full min-h-[80vh] w-full items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="text-center space-y-6 max-w-md"
      >
        <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-red-500/10 border border-red-500/20">
          <AlertCircle className="h-10 w-10 text-red-400" />
        </div>
        <div className="space-y-2">
          <h2 className="text-2xl font-bold text-white">Algo salió mal</h2>
          <p className="text-zinc-400">
            Ocurrió un error inesperado. Puedes intentar recargar esta sección.
          </p>
          {error.message && (
            <p className="text-xs text-zinc-600 font-mono mt-2 bg-black/30 p-2 rounded-lg break-all">
              {error.message}
            </p>
          )}
        </div>
        <Button
          onClick={reset}
          className="bg-white text-black hover:bg-zinc-200 h-11 px-6"
        >
          <RotateCcw className="mr-2 h-4 w-4" />
          Reintentar
        </Button>
      </motion.div>
    </div>
  );
}
