"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { LogOut, LayoutDashboard, Users, Activity, Settings } from "lucide-react";

import { useEffect } from "react";
import { useAdminStore } from "@/store/useAdminStore";
import { clearAdminAuthState, supabase } from "@/lib/supabase";

const routes = [
  { label: "Overview", icon: LayoutDashboard, href: "/" },
  { label: "Community", icon: Users, href: "/users" },
  { label: "Activities CMS", icon: Activity, href: "/cms" },
  { label: "Settings", icon: Settings, href: "/settings" },
];

export function Sidebar() {
  const pathname = usePathname();
  const { adminProfile, fetchAdminProfile } = useAdminStore();
  const clearProfile = useAdminStore((s) => s.clearProfile);

  useEffect(() => {
    if (!adminProfile) {
      fetchAdminProfile();
    }
  }, [adminProfile, fetchAdminProfile]);

  const initials = adminProfile?.username
    ? adminProfile.username.slice(0, 2).toUpperCase()
    : adminProfile?.email?.slice(0, 2).toUpperCase() || "AD";

  const displayName = adminProfile?.username || adminProfile?.email?.split('@')[0] || "Administrador";
  const displayRole = adminProfile?.role === 'admin' ? 'Super Admin' : (adminProfile?.role || 'Admin');

  return (
    <div className="w-64 h-full hidden md:flex flex-col gap-4 p-4 border-r border-white/10 bg-black/20 backdrop-blur-xl supports-[backdrop-filter]:bg-black/10">
      <div className="py-6 px-4 flex items-center gap-3">
        <div className="w-16 h-16 rounded-full bg-gradient-to-tr from-indigo-500 via-purple-500 to-pink-500 p-[2px] animate-[pulse_3s_ease-in-out_infinite] shadow-[0_0_15px_rgba(168,85,247,0.5)] shrink-0">
          <div className="w-full h-full bg-black rounded-full overflow-hidden flex items-center justify-center relative">
            <Image src="/assets/mascot/lumi-nav.png" alt="Lumi AI" fill unoptimized={true} className="object-cover opacity-90 mix-blend-screen" />
          </div>
        </div>
        <div className="flex flex-col">
           <h1 className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-white to-white/70 tracking-widest leading-none">
             ANÍMA<span className="text-indigo-400 text-xs align-top ml-1">✧</span>
           </h1>
           <p className="text-[10px] text-indigo-300/60 uppercase tracking-widest mt-1 font-semibold">Dashboard</p>
        </div>
      </div>

      <nav className="flex-1 space-y-2">
        {routes.map((route) => (
          <Link
            key={route.href}
            href={route.href}
            className={cn(
              "flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-300",
              pathname === route.href
                ? "bg-white/10 text-white shadow-[0_0_15px_rgba(255,255,255,0.1)] border border-white/10"
                : "text-zinc-400 hover:text-white hover:bg-white/5"
            )}
          >
            <route.icon className="h-5 w-5" />
            <span className="font-medium text-sm">{route.label}</span>
          </Link>
        ))}
      </nav>

      <div className="p-4 border-t border-white/10 flex flex-col gap-4">
        <Link href="/profile" className="flex items-center gap-3 w-full p-2 rounded-lg hover:bg-white/5 transition-colors">
          <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-blue-500 to-purple-500 flex items-center justify-center shadow-md">
            <span className="text-xs text-white font-bold">{initials}</span>
          </div>
          <div className="flex flex-col overflow-hidden">
            <span className="text-sm font-medium text-white hover:text-blue-400 transition-colors truncate">{displayName}</span>
            <span className="text-xs text-emerald-400 font-medium capitalize">{displayRole}</span>
          </div>
        </Link>
        <button 
          onClick={async () => {
            // 1. Limpiar estado de Zustand
            clearProfile();
            // 2. Cerrar sesión en Supabase
            await supabase.auth.signOut().catch(() => {});
            // 3. Borrar la cookie de sesión
            clearAdminAuthState();
            // 4. Redirigir al login
            window.location.href = '/login';
          }}
          className="flex items-center gap-2 text-sm text-red-400 hover:text-red-300 transition-colors w-full p-2 rounded-lg hover:bg-red-400/10 mt-2"
        >
          <LogOut className="h-4 w-4" />
          <span>Cerrar Sesión</span>
        </button>
      </div>
    </div>
  );
}
