"use client";

import { useState } from "react";
import Link from "next/link";

export default function GiveInterviewPage() {
    const [fullUrl, setFullUrl] = useState("");

    const handleJoin = () => {
        const trimmed = fullUrl.trim();

        if (!trimmed) {
            alert("Please enter a valid URL");
            return;
        }

        try {
            const url = new URL(trimmed);
            if (url.pathname.startsWith("/interview")) {
                window.location.href = trimmed; // Redirect to full URL
            } else {
                alert("URL must include path starting with /interview");
            }
        } catch (e) {
            alert("Please enter a valid full URL (including http/https)");
        }
    };

    return (
        <div className="flex flex-col items-center justify-center min-h-screen w-full font-extrabold px-4">
            <h2 className="text-4xl mb-6 text-center">Join Interview</h2>

            {/* Full URL input */}
            <div className="flex flex-col sm:flex-row gap-4 items-center mb-10 w-full max-w-2xl">
                <input
                    type="text"
                    value={fullUrl}
                    onChange={(e) => setFullUrl(e.target.value)}
                    placeholder="Enter full URL"
                    className="flex-1 px-4 py-3 rounded-lg border w-full sm:w-auto"
                />
                <button
                    onClick={handleJoin}
                    className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
                >
                    Join
                </button>
            </div>

            {/* OR separator */}
            <div className="flex items-center justify-center w-full max-w-2xl mb-10">
                <div className="flex-grow h-px bg-gray-300" />
                <span className="px-4 text-gray-500 text-lg">OR</span>
                <div className="flex-grow h-px bg-gray-300" />
            </div>

            {/* Practice options */}
            <h2 className="text-4xl mb-6 text-center">Select Practice Type</h2>
            <div className="flex gap-4 flex-wrap justify-center w-full">
                <Link href="/interview/DSA" className="flex-1 max-w-xs">
                    <div className="flex text-2xl items-center justify-center border rounded-xl hover:shadow-[0_20px_50px_rgba(8,_112,_184,_0.7)] p-4 h-40 m-auto hover:scale-90 transition-transform">
                        DSA
                    </div>
                </Link>
                <Link href="/interview/Machine_coding" className="flex-1 max-w-xs">
                    <div className="flex text-2xl items-center justify-center border rounded-xl hover:shadow-[0_20px_50px_rgba(8,_112,_184,_0.7)] p-4 h-40 m-auto hover:scale-90 transition-transform">
                        Machine Coding
                    </div>
                </Link>
            </div>
        </div>
    );
}
