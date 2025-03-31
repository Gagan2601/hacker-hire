// components/camera-feed.tsx
"use client";

import { useEffect, useRef } from "react";
import { useCameraStore } from "@/store/useCameraStore";

export default function CameraFeed() {
    const { stream, setStream, isActivePage, stopStream } = useCameraStore();
    const videoRef = useRef<HTMLVideoElement>(null);

    useEffect(() => {
        const startCamera = async () => {
            if (!stream && isActivePage) {
                try {
                    console.log("Starting camera...");
                    const newStream = await navigator.mediaDevices.getUserMedia({ video: true });
                    setStream(newStream);
                } catch (err) {
                    console.error("Error accessing camera:", err);
                }
            }
        };

        startCamera();

        return () => {
            if (!isActivePage && stream) {
                stopStream();
            }
        };
    }, [isActivePage, stream, setStream, stopStream]);

    useEffect(() => {
        if (videoRef.current && stream) {
            if (videoRef.current.srcObject !== stream) {
                videoRef.current.srcObject = stream;
            }
        }
    }, [stream]);

    if (!isActivePage) return null;

    return (
        <div className="w-full max-w-md">
            <video ref={videoRef} autoPlay playsInline className="w-full h-auto rounded-lg" />
        </div>
    );
}