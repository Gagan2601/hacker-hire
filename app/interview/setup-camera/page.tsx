// app/interview/setup-camera/page.tsx
"use client";

import { useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import CameraFeed from "@/components/camera-feed";
import { useCameraStore } from "@/store/useCameraStore";

export default function CameraSetupPage() {
    const { stream, setIsActivePage } = useCameraStore();
    const router = useRouter();
    const searchParams = useSearchParams();
    const category = searchParams.get("category");
    const questionId = searchParams.get("questionId");

    useEffect(() => {
        // Set this page as an active camera page
        setIsActivePage(true);

        return () => {
            // If navigating away from this page to a non-camera page
            // the cleanup will happen in the CameraFeed component
        };
    }, [setIsActivePage]);

    return (
        <div className="flex flex-col items-center justify-center h-screen bg-black text-white">
            <p className="text-lg mb-4">{stream ? "Camera Ready" : "Initializing camera..."}</p>

            <CameraFeed />

            {stream && category && questionId && (
                <button
                    onClick={() => router.push(`/interview/give/practice/${category}/${questionId}`)}
                    className="mt-6 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                >
                    Proceed to Question
                </button>
            )}
        </div>
    );
}