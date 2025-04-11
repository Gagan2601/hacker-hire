import { WarpBackground } from "@/components/magicui/warp-background";
import Link from "next/link";

export default function CategorySelectionPage() {
    return (
        <WarpBackground className="flex flex-col items-center justify-center min-h-screen w-full">
            <div className="flex flex-col items-center justify-center font-extrabold">
                <h2 className="text-4xl mb-6">Select Category</h2>
                <div className="flex gap-4 w-full">
                    <Link href="/interview/DSA" className="flex-1">
                        <div className="flex text-2xl items-center justify-center border rounded-xl hover:shadow-[0_20px_50px_rgba(8,_112,_184,_0.7)] p-4 w-72 h-40 m-auto  hover:scale-90 transition-transform">
                            DSA
                        </div>
                    </Link>
                    <Link href="/interview/Machine_coding" className="flex-1">
                        <div className="flex text-2xl items-center justify-center border rounded-xl hover:shadow-[0_20px_50px_rgba(8,_112,_184,_0.7)] p-4 w-72 h-40 m-auto  hover:scale-90 transition-transform">
                            Machine Coding
                        </div>
                    </Link>
                </div>
            </div>
        </WarpBackground>
    );
}
