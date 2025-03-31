"use client"
import { WarpBackground } from "@/components/magicui/warp-background";
import { Button } from "@/components/ui/button";
import Link from "next/link";

export default function Home() {

  return (
    <WarpBackground className="flex flex-col items-center justify-center min-h-screen w-full">
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


  );
}