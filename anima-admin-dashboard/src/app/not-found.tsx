"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { AlertTriangle, Home } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function NotFound() {
  return (
    <div className="flex h-full min-h-[80vh] w-full items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="text-center space-y-6"
      >
        <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-amber-500/10 border border-amber-500/20">
          <AlertTriangle className="h-10 w-10 text-amber-400" />
        </div>
        <div className="space-y-2">
          <h1 className="text-4xl font-bold text-white">404</h1>
          <p className="text-zinc-400 text-lg">Esta página no existe en el ecosistema de Aníma.</p>
        </div>
        <Link href="/">
          <Button className="bg-white text-black hover:bg-zinc-200 h-11 px-6">
            <Home className="mr-2 h-4 w-4" />
            Volver al Dashboard
          </Button>
        </Link>
      </motion.div>
    </div>
  );
}
