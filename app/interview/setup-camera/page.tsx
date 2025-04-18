// app/interview/setup-camera/page.tsx
"use client";

import { useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import CameraFeed from "@/components/camera-feed";
import { useCameraStore } from "@/store/useCameraStore";

function CameraSetupContent() {
    const { stream, setIsActivePage } = useCameraStore();
    const router = useRouter();
    const searchParams = useSearchParams();
    const category = searchParams?.get("category");
    const questionId = searchParams?.get("questionId");
    const template = searchParams?.get("template");
    const roomId = searchParams?.get("roomId");

    useEffect(() => {
        // Set this page as an active camera page
        setIsActivePage(true);

        return () => {
            // If navigating away from this page to a non-camera page
            // the cleanup will happen in the CameraFeed component
        };
    }, [setIsActivePage]);

    const handleProceed = () => {
        if (category?.toLowerCase() === "machine_coding" && template && roomId) {
            // For machine-coding, proceed to the playground with the selected template and room ID
            router.push(`/interview/${category}/${questionId}/${template}/${roomId}`);
        } else {
            // For other categories, proceed to the regular question page
            router.push(`/interview/${category}/${questionId}/${roomId}`);
        }
    };

    return (
        <div className="flex flex-col items-center justify-center h-screen bg-black text-white">
            <p className="text-lg mb-4">{stream ? "Camera Ready" : "Initializing camera..."}</p>

            <CameraFeed localStream={null} remoteStream={null} />

            {stream && category && questionId && (
                <button
                    onClick={handleProceed}
                    className="mt-6 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                >
                    Proceed to Question
                </button>
            )}
        </div>
    );
}

export default function CameraSetupPage() {
    return (
        <Suspense fallback={<div className="flex items-center justify-center h-screen bg-black text-white">Loading...</div>}>
            <CameraSetupContent />
        </Suspense>
    );
}