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
    const localCanvasRef = useRef<HTMLCanvasElement>(null);
    const remoteCanvasRef = useRef<HTMLCanvasElement>(null);
    const [position, setPosition] = useState({ x: 100, y: 100 });
    const [size] = useState({ width: 320, height: 240 });
    const [localError, setLocalError] = useState<string | null>(null);
    const [remoteError, setRemoteError] = useState<string | null>(null);
    const isFixedPage = pathname === "/interview/setup-camera";

    // Load face-api tinyFaceDetector model
    useEffect(() => {
        const loadModels = async () => {
            try {
                await faceapi.nets.tinyFaceDetector.loadFromUri("/models");
            } catch (error) {
                console.error("Error loading TinyFaceDetector model:", error);
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

    // Set local stream and detect faces
    useEffect(() => {
        if (localVideoRef.current && stream) {
            localVideoRef.current.srcObject = stream;
        }

        if (localVideoRef.current && localCanvasRef.current && stream) {
            const video = localVideoRef.current;
            const canvas = localCanvasRef.current;
            const context = canvas.getContext("2d");

            const detectFaces = async () => {
                if (!video || !context) return;

                const displaySize = { width: video.videoWidth, height: video.videoHeight };
                faceapi.matchDimensions(canvas, displaySize);

                const detections = await faceapi.detectAllFaces(video, new faceapi.TinyFaceDetectorOptions());

                context.clearRect(0, 0, canvas.width, canvas.height);
                const resizedDetections = faceapi.resizeResults(detections, displaySize);

                if (detections.length > 1) {
                    const errorMsg = `Error: ${detections.length} faces detected in local stream. Only one face is allowed.`;
                    console.error(errorMsg);
                    setLocalError(errorMsg);
                } else {
                    setLocalError(null);
                    faceapi.draw.drawDetections(canvas, resizedDetections);
                }
            };

            video.onloadedmetadata = () => {
                canvas.width = video.videoWidth;
                canvas.height = video.videoHeight;
                const interval = setInterval(detectFaces, 100);
                return () => clearInterval(interval);
            };
        }
    }, [stream]);

    // Set remote stream and detect faces
    useEffect(() => {
        if (remoteVideoRef.current && remoteStream) {
            remoteVideoRef.current.srcObject = remoteStream;
        }

        if (remoteVideoRef.current && remoteCanvasRef.current && remoteStream) {
            const video = remoteVideoRef.current;
            const canvas = remoteCanvasRef.current;
            const context = canvas.getContext("2d");

            const detectFaces = async () => {
                if (!video || !context) return;

                const displaySize = { width: video.videoWidth, height: video.videoHeight };
                faceapi.matchDimensions(canvas, displaySize);

                const detections = await faceapi.detectAllFaces(video, new faceapi.TinyFaceDetectorOptions());

                context.clearRect(0, 0, canvas.width, canvas.height);
                const resizedDetections = faceapi.resizeResults(detections, displaySize);

                if (detections.length > 1) {
                    const errorMsg = `Error: ${detections.length} faces detected in remote stream. Only one face is allowed.`;
                    console.error(errorMsg);
                    setRemoteError(errorMsg);
                } else {
                    setRemoteError(null);
                    faceapi.draw.drawDetections(canvas, resizedDetections);
                }
            };

            video.onloadedmetadata = () => {
                canvas.width = video.videoWidth;
                canvas.height = video.videoHeight;
                const interval = setInterval(detectFaces, 100);
                return () => clearInterval(interval);
            };
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
                    <canvas
                        ref={localCanvasRef}
                        className="absolute top-0 left-0 w-full h-full"
                        style={{ zIndex: 10 }}
                    />
                    {localError && (
                        <div className="absolute top-2 left-2 bg-red-600 text-white p-2 rounded text-sm z-20">
                            {localError}
                        </div>
                    )}
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
                            <>
                                <video
                                    ref={remoteVideoRef}
                                    autoPlay
                                    playsInline
                                    className="w-full h-full object-cover rounded"
                                />
                                <canvas
                                    ref={remoteCanvasRef}
                                    className="absolute top-0 left-0 w-full h-full"
                                    style={{ zIndex: 10 }}
                                />
                                {remoteError && (
                                    <div className="absolute top-2 left-2 bg-red-600 text-white p-2 rounded text-sm z-20">
                                        {remoteError}
                                    </div>
                                )}
                            </>
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
                            <canvas
                                ref={localCanvasRef}
                                className="absolute top-0 left-0 w-full h-full"
                                style={{ zIndex: 10 }}
                            />
                            {localError && (
                                <div className="absolute top-2 left-2 bg-red-600 text-white p-2 rounded text-sm z-20">
                                    {localError}
                                </div>
                            )}
                        </div>
                    </div>
                </Rnd>
            )}
        </div>
    );
}