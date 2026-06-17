import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { AuroraBackground } from "@/components/layout/aurora-background";
import { Shell } from "@/components/layout/shell";
import { Toaster } from "@/components/ui/sonner";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Aníma | Admin Dashboard",
  description: "Panel de administración premium para la app móvil Aníma",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es" className="dark">
      <body className={`${inter.className} relative min-h-screen text-foreground overflow-hidden`}>
        <AuroraBackground />
        <Shell>{children}</Shell>
        <Toaster position="top-center" richColors theme="dark" />
      </body>
    </html>
  );
}
