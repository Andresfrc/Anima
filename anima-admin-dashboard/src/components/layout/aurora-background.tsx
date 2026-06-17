"use client";

import { cn } from "@/lib/utils";
import React, { ReactNode } from "react";

interface AuroraBackgroundProps extends React.HTMLProps<HTMLDivElement> {
  children?: ReactNode;
  showRadialGradient?: boolean;
}

export function AuroraBackground({
  className,
  children,
  showRadialGradient = true,
  ...props
}: AuroraBackgroundProps) {
  return (
    <div
      className={cn(
        "fixed inset-0 z-[-1] overflow-hidden bg-zinc-950 text-slate-950 transition-bg",
        className
      )}
      {...props}
    >
      <div className="absolute inset-0 overflow-hidden">
        <div
          // We use absolute positioning and a high-performance blur effect
          className={cn(
            `
            [--white-gradient:repeating-linear-gradient(100deg,#fff_0%,#fff_7%,transparent_10%,transparent_12%,#fff_16%)]
            [--dark-gradient:repeating-linear-gradient(100deg,#000_0%,#000_7%,transparent_10%,transparent_12%,#000_16%)]
            [--aurora:repeating-linear-gradient(100deg,#3b82f6_10%,#818cf8_20%,#22d3ee_30%,#a855f7_40%,#60a5fa_50%)]
            [background-image:var(--dark-gradient),var(--aurora)]
            [background-size:300%,_200%]
            [background-position:50%_50%,50%_50%]
            filter blur-[15px] invert-0
            after:content-[""] after:absolute after:inset-0 after:[background-image:var(--dark-gradient),var(--aurora)] 
            after:[background-size:200%,_100%] 
            after:animate-aurora after:[background-attachment:fixed] after:mix-blend-overlay
            pointer-events-none
            absolute -inset-[10px] opacity-100 will-change-transform`,
            showRadialGradient &&
              `[mask-image:radial-gradient(ellipse_at_100%_0%,black_10%,transparent_70%)]`
          )}
        ></div>
        
        {/* Overlay extra para oscurecer y mejorar lectura de datos, ajustado a opacidad más baja para que no se vea "negro total" si la aurora no carga */}
        <div className="absolute inset-0 bg-gradient-to-br from-zinc-950/80 via-zinc-950/60 to-black/80 backdrop-blur-[2px]" />
        
        {/* Lumi's Magic Ecosystem / Stardust Orbs */}
        <div className="absolute top-[20%] left-[15%] w-[30vw] h-[30vw] min-w-[300px] bg-indigo-500/30 rounded-full blur-[80px] animate-[pulse_8s_ease-in-out_infinite] pointer-events-none mix-blend-screen" />
        <div className="absolute bottom-[20%] right-[10%] w-[40vw] h-[40vw] min-w-[400px] bg-purple-500/30 rounded-full blur-[100px] animate-[pulse_12s_ease-in-out_infinite_reverse] pointer-events-none mix-blend-screen" />
        <div className="absolute top-[50%] left-[40%] w-[25vw] h-[25vw] min-w-[250px] bg-cyan-500/30 rounded-full blur-[70px] animate-[pulse_6s_ease-in-out_infinite] pointer-events-none mix-blend-screen" />
      </div>
      {children}
    </div>
  );
}
