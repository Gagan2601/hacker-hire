// app/layout.tsx
import DeployButton from "@/components/deploy-button";
import { EnvVarWarning } from "@/components/env-var-warning";
import HeaderAuth from "@/components/header-auth";
import { ThemeSwitcher } from "@/components/theme-switcher";
import { hasEnvVars } from "@/utils/supabase/check-env-vars";
import { Geist } from "next/font/google";
import { ThemeProvider } from "next-themes";
import Link from "next/link";
import "./globals.css";
import CameraLayoutManager from "@/components/camera-layout-manager";

const geistSans = Geist({
  display: "swap",
  subsets: ["latin"],
});

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={geistSans.className} suppressHydrationWarning>
      <body className="bg-background text-foreground flex flex-col min-h-screen">
        <ThemeProvider attribute="class" defaultTheme="system" enableSystem disableTransitionOnChange>
          {/* {!hideNavbar && ( */}
          <nav className="w-full flex justify-center border-b border-b-foreground/10 h-16">
            <div className="w-full max-w-5xl flex justify-between items-center p-3 px-5 text-sm">
              <div className="flex gap-5 items-center font-semibold text-xl">
                <Link href={"/"}>Hacker Hire</Link>
              </div>
              {!hasEnvVars ? <EnvVarWarning /> : <HeaderAuth />}
              {!hasEnvVars ? null : <ThemeSwitcher />}
            </div>
          </nav>
          {/* )} */}

          {/* Main Content with Camera Manager */}
          <main className="relative flex-1 w-full flex flex-col gap-10">
            <CameraLayoutManager>
              {children}
            </CameraLayoutManager>
          </main>

          {/* Footer (Sticks to Bottom) */}
          <footer className="w-full flex items-center justify-center border-t text-center text-xs gap-8 py-5 bg-gray-900 text-white">
            <p>Powered by Supabase</p>
          </footer>
        </ThemeProvider>
      </body>
    </html>
  );
}