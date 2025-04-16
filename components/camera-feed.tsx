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
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const canvasRefRemote = useRef<HTMLCanvasElement>(null);
    const [position, setPosition] = useState({ x: 100, y: 100 });
    const [size] = useState({ width: 320, height: 240 });
    const isFixedPage = pathname === "/interview/setup-camera";
    const [isSwapped, setIsSwapped] = useState(false);

    const handleSwapVideos = () => {
        setIsSwapped((prev) => !prev);
    };

    // Load face-api models
    useEffect(() => {
        const loadModels = async () => {
            await faceapi.nets.tinyFaceDetector.loadFromUri("/models");
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
        const videoRef = isSwapped ? remoteVideoRef : localVideoRef;
        if (videoRef.current && stream) {
            videoRef.current.srcObject = stream;
            console.log("Local stream set:", stream.getTracks().map((t) => ({ kind: t.kind, enabled: t.enabled, readyState: t.readyState })));
        }
    }, [stream, isSwapped]);

    // Set remote stream
    useEffect(() => {
        const videoRef = isSwapped ? localVideoRef : remoteVideoRef;
        if (videoRef.current && remoteStream) {
            videoRef.current.srcObject = remoteStream;
            console.log("Remote stream set:", remoteStream.getTracks().map((t) => ({ kind: t.kind, enabled: t.enabled, readyState: t.readyState })));
        }
    }, [remoteStream, isSwapped]);

    // Face detection for local stream
    useEffect(() => {
        let interval: NodeJS.Timeout;

        const startDetection = async () => {
            const video = isSwapped ? remoteVideoRef.current : localVideoRef.current;
            const canvas = canvasRef.current;

            if (!video || !canvas) return;

            const runDetection = async () => {
                if (video.readyState !== 4) return;

                const videoWidth = video.videoWidth;
                const videoHeight = video.videoHeight;

                if (videoWidth === 0 || videoHeight === 0) return;

                canvas.width = videoWidth;
                canvas.height = videoHeight;

                const displaySize = { width: videoWidth, height: videoHeight };
                faceapi.matchDimensions(canvas, displaySize);

                const detections = await faceapi.detectAllFaces(video, new faceapi.TinyFaceDetectorOptions());
                const resized = faceapi.resizeResults(detections, displaySize);

                const ctx = canvas.getContext("2d");
                if (!ctx) return;

                ctx.clearRect(0, 0, canvas.width, canvas.height);
                faceapi.draw.drawDetections(canvas, resized);

                if (resized.length === 0) {
                    ctx.fillStyle = "red";
                    ctx.font = "18px Arial";
                    ctx.fillText("ALERT: Face Not Detected!", 10, 25);
                } else if (resized.length > 1) {
                    ctx.fillStyle = "orange";
                    ctx.font = "18px Arial";
                    ctx.fillText("ALERT: Multiple Faces Detected!", 10, 25);
                }
            };

            interval = setInterval(runDetection, 500);
        };

        startDetection();

        return () => clearInterval(interval);
    }, [stream, isSwapped]);

    // Face detection for remote stream
    useEffect(() => {
        let interval: NodeJS.Timeout;

        const startRemoteDetection = async () => {
            const video = isSwapped ? localVideoRef.current : remoteVideoRef.current;
            const canvas = canvasRefRemote.current;

            if (!video || !canvas) return;

            const runDetection = async () => {
                if (video.readyState !== 4) return;

                const videoWidth = video.videoWidth;
                const videoHeight = video.videoHeight;

                if (videoWidth === 0 || videoHeight === 0) return;

                canvas.width = videoWidth;
                canvas.height = videoHeight;

                const displaySize = { width: videoWidth, height: videoHeight };
                faceapi.matchDimensions(canvas, displaySize);

                const detections = await faceapi.detectAllFaces(video, new faceapi.TinyFaceDetectorOptions());
                const resized = faceapi.resizeResults(detections, displaySize);

                const ctx = canvas.getContext("2d");
                if (!ctx) return;

                ctx.clearRect(0, 0, canvas.width, canvas.height);
                faceapi.draw.drawDetections(canvas, resized);

                if (resized.length === 0) {
                    ctx.fillStyle = "red";
                    ctx.font = "18px Arial";
                    ctx.fillText("ALERT: Face Not Detected!", 10, 25);
                } else if (resized.length > 1) {
                    ctx.fillStyle = "orange";
                    ctx.font = "18px Arial";
                    ctx.fillText("ALERT: Multiple Faces Detected!", 10, 25);
                }
            };

            interval = setInterval(runDetection, 500);
        };

        startRemoteDetection();

        return () => clearInterval(interval);
    }, [remoteStream, isSwapped]);

    if (!isActivePage) return null;

    const LocalVideoWithCanvas = (
        <div className="relative w-full h-full bg-black rounded-lg overflow-hidden">
            <video
                ref={localVideoRef}
                autoPlay
                playsInline
                muted
                className="w-full h-full object-cover rounded"
            />
            <canvas ref={canvasRef} className="absolute top-0 left-0 w-full h-full z-10 pointer-events-none" />
        </div>
    );

    const RemoteVideoWithCanvas = (
        <div className="relative w-full h-full bg-black rounded-lg overflow-hidden">
            <video
                ref={remoteVideoRef}
                autoPlay
                playsInline
                className="w-full h-full object-cover rounded"
            />
            <canvas ref={canvasRefRemote} className="absolute top-0 left-0 w-full h-full z-10 pointer-events-none" />
        </div>
    );

    return isFixedPage ? (
        <div className="w-full max-w-md">{LocalVideoWithCanvas}</div>
    ) : (
        <div className="w-full max-w-md">
            <Rnd
                default={{
                    x: position.x,
                    y: position.y,
                    width: size.width,
                    height: size.height,
                }}
                disableDragging={false}
                enableResizing={false}
                onDragStop={(e, d) => setPosition({ x: d.x, y: d.y })}
                className="border border-white shadow-lg rounded-lg overflow-hidden"
                style={{ position: "absolute", zIndex: 1000, cursor: "grab" }}
            >
                <div className="relative w-full h-full bg-black rounded-lg overflow-hidden">
                    {isSwapped ? (
                        <>
                            {/* Local as main */}
                            {LocalVideoWithCanvas}
                            <div
                                onClick={handleSwapVideos}
                                className="absolute bottom-2 right-2 w-1/4 h-auto border-2 border-white rounded shadow-lg overflow-hidden cursor-pointer"
                            >
                                {remoteStream ? RemoteVideoWithCanvas : <div className="w-full h-full bg-gray-800 rounded" />}
                            </div>
                        </>
                    ) : (
                        <>
                            {/* Remote as main */}
                            {remoteStream ? (
                                RemoteVideoWithCanvas
                            ) : (
                                <div className="w-full h-full flex items-center justify-center text-white text-sm italic bg-gray-800 rounded">
                                    Waiting for another user to join...
                                </div>
                            )}
                            <div
                                onClick={handleSwapVideos}
                                className="absolute bottom-2 right-2 w-1/4 h-auto border-2 border-white rounded shadow-lg overflow-hidden cursor-pointer"
                            >
                                {LocalVideoWithCanvas}
                            </div>
                        </>
                    )}
                </div>
            </Rnd>
        </div>
    );
}