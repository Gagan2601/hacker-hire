"use client";

import { useEffect, useRef, useState } from "react";
import { useCameraStore } from "@/store/useCameraStore";
import { Rnd } from "react-rnd";
import { usePathname } from "next/navigation";
import * as faceapi from "face-api.js";

interface CameraFeedProps {
    localStream: MediaStream | null;
    remoteStream: MediaStream | null;
}

export default function CameraFeed({ localStream, remoteStream }: CameraFeedProps) {
    const pathname = usePathname();
    const { stream, setStream, isActivePage, stopStream } = useCameraStore();
    const localVideoRef = useRef<HTMLVideoElement>(null);
    const remoteVideoRef = useRef<HTMLVideoElement>(null);
    const [position, setPosition] = useState({ x: 100, y: 100 });
    const [size] = useState({ width: 320, height: 240 });
    const isFixedPage = pathname === "/interview/setup-camera";

    // Load face-api models
    useEffect(() => {
        const loadModels = async () => {
            try {
                await faceapi.nets.tinyFaceDetector.loadFromUri("/models");
                console.log("Face-api models loaded");
            } catch (error) {
                console.error("Error loading face-api models:", error);
            }
        };
        loadModels();
    }, []);

    // Start camera stream
    useEffect(() => {
        const startCamera = async () => {
            if (!stream && isActivePage) {
                try {
                    const newStream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
                    setStream(newStream);
                    console.log("Camera stream started:", newStream.getTracks().map((t) => ({ kind: t.kind, enabled: t.enabled, readyState: t.readyState })));
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

    // Set local stream
    useEffect(() => {
        if (localVideoRef.current && stream) {
            localVideoRef.current.srcObject = stream;
            console.log("Local stream set:", stream.getTracks().map((t) => ({ kind: t.kind, enabled: t.enabled, readyState: t.readyState })));
        }
    }, [stream]);

    // Set remote stream
    useEffect(() => {
        if (remoteVideoRef.current && remoteStream) {
            remoteVideoRef.current.srcObject = remoteStream;
            console.log("Remote stream set:", remoteStream.getTracks().map((t) => ({ kind: t.kind, enabled: t.enabled, readyState: t.readyState })));
        }
    }, [remoteStream]);

    if (!isActivePage) return null;

    return (
        <div className="w-full max-w-md">
            {isFixedPage ? (
                <div className="relative w-full h-full bg-black rounded-lg overflow-hidden">
                    <video
                        ref={localVideoRef}
                        autoPlay
                        playsInline
                        muted
                        className="w-full h-full object-cover rounded"
                    />
                </div>
            ) : (
                <Rnd
                    default={{ x: position.x, y: position.y, width: size.width, height: size.height }}
                    disableDragging={false}
                    enableResizing={false}
                    onDragStop={(e, d) => setPosition({ x: d.x, y: d.y })}
                    className="border border-white shadow-lg rounded-lg overflow-hidden"
                    style={{ position: "absolute", zIndex: 1000, cursor: "grab" }}
                >
                    <div className="relative w-full h-full bg-black rounded-lg overflow-hidden">
                        {remoteStream ? (
                            <video
                                ref={remoteVideoRef}
                                autoPlay
                                playsInline
                                className="w-full h-full object-cover rounded"
                            />
                        ) : (
                            <div className="w-full h-full flex items-center justify-center text-white text-sm italic bg-gray-800 rounded">
                                Waiting for another user to join...
                            </div>
                        )}
                        <div className="absolute bottom-2 right-2 w-1/4 h-auto border-2 border-white rounded shadow-lg overflow-hidden">
                            <video
                                ref={localVideoRef}
                                autoPlay
                                playsInline
                                muted
                                className="w-full h-full object-cover rounded"
                            />
                        </div>
                    </div>
                </Rnd>
            )}
        </div>
    );
}