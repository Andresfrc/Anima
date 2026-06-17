"use client";

import { usePathname } from "next/navigation";
import { Sidebar } from "./sidebar";

const AUTH_ROUTES = ["/login", "/register", "/forgot-password", "/reset-password"];

export function Shell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isAuthPage = AUTH_ROUTES.some((route) => pathname.startsWith(route));

  if (isAuthPage) {
    // Páginas de auth: sin sidebar, solo centrar contenido
    return (
      <div className="flex h-screen w-full items-center justify-center relative z-10">
        {children}
      </div>
    );
  }

  // Resto del dashboard: con sidebar
  return (
    <div className="flex h-screen relative z-10">
      <Sidebar />
      <main className="flex-1 h-full overflow-y-auto overflow-x-hidden p-6 lg:p-10">
        {children}
      </main>
    </div>
  );
}
