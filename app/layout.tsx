// app/layout.tsx
import { Geist } from "next/font/google";
import { ThemeProvider } from "next-themes";
import Link from "next/link";
import "./globals.css";
import CameraLayoutManager from "@/components/camera-layout-manager";

const geistSans = Geist({
  display: "swap",
  subsets: ["latin"],
});

export const metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3000"),
  title: "Hacker Hire",
  description: "Interview platform for coding and technical assessments",
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={geistSans.className} suppressHydrationWarning>
      <body className="bg-background text-foreground flex flex-col min-h-screen">
        <ThemeProvider attribute="class" defaultTheme="system" enableSystem disableTransitionOnChange>

          {/* <nav className="w-full flex justify-center border-b border-b-foreground/10 h-16">
            <div className="w-full max-w-5xl flex justify-between items-center p-3 px-5 text-sm">
              <div className="flex gap-5 items-center font-semibold text-xl">
                <Link href={"/"}>Hacker Hire</Link>
              </div>
              {!hasEnvVars ? <EnvVarWarning /> : <HeaderAuth />}
              {!hasEnvVars ? null : <ThemeSwitcher />}
            </div>
          </nav> */}


          {/* Main Content with Camera Manager */}
          <main className="relative flex-1 w-full flex flex-col min-h-screen">
            <CameraLayoutManager>
              {children}
            </CameraLayoutManager>
          </main>


        </ThemeProvider>
      </body>
    </html>
  );
}