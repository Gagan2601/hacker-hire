// components/camera-feed.tsx
"use client";

import { useEffect, useRef, useState } from "react";
import { useCameraStore } from "@/store/useCameraStore";
import { Rnd } from "react-rnd";
import { usePathname } from "next/navigation";

export default function CameraFeed() {
    const pathname = usePathname();
    const { stream, setStream, isActivePage, stopStream } = useCameraStore();
    const videoRef = useRef<HTMLVideoElement>(null);
    const [position, setPosition] = useState({ x: 100, y: 100 });
    const [size, setSize] = useState({ width: 320, height: 240 });
    const isFixedPage = pathname === "/interview/setup-camera";
    const aspectRatio = 320 / 240;

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

    return isFixedPage ? (
        <div className="w-full max-w-md">
            <video ref={videoRef} autoPlay playsInline className="w-full h-auto rounded-lg" />
        </div>
    ) : (
        <div className="w-full max-w-md">
            <Rnd
                size={{ width: size.width, height: size.height }}
                position={{ x: position.x, y: position.y }}
                onDragStop={(e, d) => setPosition({ x: d.x, y: d.y })}
                onResizeStop={(e, direction, ref, delta, position) => {
                    const newWidth = ref.offsetWidth;
                    const newHeight = newWidth / aspectRatio; // Maintain aspect ratio
                    setSize({ width: newWidth, height: newHeight });
                    setPosition(position);
                }}
                enableResizing={{
                    top: false,
                    bottom: true,
                    left: true,
                    right: true,
                    topLeft: false,
                    topRight: false,
                    bottomLeft: true,
                    bottomRight: true,
                }}
                enabledragging="true"
                className="border border-white shadow-lg rounded-lg"
                style={{ position: "absolute", zIndex: 1000, cursor: "grab" }}
                minWidth={320}
                minHeight={240}
                lockAspectRatio
            >
                <video ref={videoRef} autoPlay playsInline className="w-full h-auto rounded-lg" />
            </Rnd>
        </div>
    );
}