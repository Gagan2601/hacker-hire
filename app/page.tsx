import { WarpBackground } from "@/components/magicui/warp-background";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { EnvVarWarning } from "@/components/env-var-warning";
import HeaderAuth from "@/components/header-auth";
import { ThemeSwitcher } from "@/components/theme-switcher";
import { hasEnvVars } from "@/utils/supabase/check-env-vars";

export default function Home() {

  return (
    <>
      <nav className="w-full flex justify-center border-b border-b-foreground/10 h-16 absolute z-10">
        <div className="w-full max-w-5xl flex justify-between items-center p-3 px-5 text-sm">
          <div className="flex gap-5 items-center font-semibold text-xl">
            <Link href={"/"}>Hacker Hire</Link>
          </div>
          {!hasEnvVars ? <EnvVarWarning /> : <HeaderAuth />}
          {!hasEnvVars ? null : <ThemeSwitcher />}
        </div>
      </nav>
      <WarpBackground className="flex flex-col items-center justify-center w-full h-screen">
        <h1 className="text-6xl font-bold text-center">Welcome to Hacker Hire</h1>
        <div className="mt-4 flex justify-center">
          <Link href="/interview" className="z-50">
            <Button className="relative overflow-hidden group px-12 py-6 rounded-full bg-gradient-to-r from-green-400 to-blue-500 text-white font-bold transition-all duration-500 hover:scale-105">
              <span className="relative z-10 text-xl">Get started</span>
              <div className="absolute inset-0 w-full h-full bg-gradient-to-r from-blue-500 to-green-400 transition-all duration-500 transform translate-x-full group-hover:translate-x-0 ease"></div>
            </Button>
          </Link>
        </div>
      </WarpBackground>
    </>

  );
}