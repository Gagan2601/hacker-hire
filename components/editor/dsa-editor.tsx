"use client";

import React, { useEffect, useRef, useState } from "react";
import dynamic from 'next/dynamic';
import { io, Socket } from "socket.io-client";
import ReactMarkdown from "react-markdown";
import rehypeHighlight from "rehype-highlight";
import "highlight.js/styles/github-dark.css";

const Editor = dynamic(
    () => import("@monaco-editor/react"),
    { ssr: false }
);

const WhiteBoard = dynamic(
    () => import("@/components/white-board/white-board"),
    { ssr: false }
);

import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Select, SelectTrigger, SelectContent, SelectItem } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { ResizablePanel, ResizablePanelGroup, ResizableHandle } from "@/components/ui/resizable";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import firebaseConfig from "@/config/firebaseConfig";
import type * as monacoTypes from "monaco-editor";
import CameraFeed from "../camera-feed";
import { CopyURLButton } from "../copy-url-button";
import { useAuthStore } from "@/store/useAuthStore";
import { useCameraStore } from "@/store/useCameraStore";
import { redirect, useRouter } from "next/navigation";
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs";

interface DsaPlaygroundProps {
    modifiedContent: string;
    question?: any;
    category: string;
    questionId?: string;
    roomId?: string;
}

const DsaPlayground: React.FC<DsaPlaygroundProps> = ({ modifiedContent, question, category, questionId, roomId }) => {
    const { isActivePage, setIsActivePage } = useCameraStore();
    const router = useRouter();
    const { username } = useAuthStore();
    const supabase = createClientComponentClient();

    useEffect(() => {
        setIsActivePage(true);
        return () => {
            // Cleanup handled in CameraFeed.tsx
        };
    }, [setIsActivePage]);

    if (!isActivePage) {
        redirect(`/interview/setup-camera?category=${category}&questionId=${questionId}&roomId=${roomId}`);
    }

    const [editor, setEditor] = useState<monacoTypes.editor.IStandaloneCodeEditor | null>(null);
    const [editorLoaded, setEditorLoaded] = useState(false);
    const [code, setCode] = useState<string>("// Write your solution here\nconsole.log('hello!!');");
    const [language, setLanguage] = useState<string>("javascript");
    const [firepad, setFirepad] = useState<any>(null);
    const [firebaseInstance, setFirebaseInstance] = useState<any>(null);
    const [localStream, setLocalStream] = useState<MediaStream | null>(null);
    const [remoteStream, setRemoteStream] = useState<MediaStream | null>(null);
    const peerConnectionRef = useRef<RTCPeerConnection | null>(null);
    const socketRef = useRef<Socket | null>(null);
    const [input, setInput] = useState<string>("");
    const [output, setOutput] = useState<string>("");
    const [showCamera, setShowCamera] = useState(true);
    const [role, setRole] = useState("");
    const [whiteboardOpen, setWhiteboardOpen] = useState(false);
    const [reportDialogOpen, setReportDialogOpen] = useState(false);
    const [reportForm, setReportForm] = useState({
        performanceRating: "3",
        notes: "",
        isCleared: "Yes",
    });

    const toggleCamera = () => {
        setShowCamera((prev) => !prev);
    };

    const toggleWhiteboard = () => {
        setWhiteboardOpen(!whiteboardOpen);
    };

    function handleEditorDidMount(editorInstance: monacoTypes.editor.IStandaloneCodeEditor) {
        editorInstance.updateOptions({ readOnly: false });
        setEditor(editorInstance);
        setEditorLoaded(true);
        console.log("Editor mounted successfully");
    }

    useEffect(() => {
        const initFirebase = async () => {
            try {
                const firebase = (await import('firebase/app')).default;
                await import('firebase/database');
                if (!firebase.apps.length) {
                    firebase.initializeApp(firebaseConfig);
                }
                setFirebaseInstance(firebase);
                console.log("Firebase initialized successfully");
            } catch (error) {
                console.error("Error initializing Firebase:", error);
            }
        };
        initFirebase();
    }, []);

    const initializeFirepad = async () => {
        if (!editor || !firebaseInstance) return;
        try {
            const { fromMonaco } = await import('@hackerrank/firepad');
            const sanitizedKey = "dsa-code".replace(/[\\.#$\\[\\\]]/g, "");
            const dbRef = firebaseInstance.database().ref(`${roomId}/${sanitizedKey}`);
            let name = username || "User";
            console.log("Initializing Firepad with editor and DB reference");
            editor.updateOptions({ readOnly: false });
            const newFirepad = fromMonaco(dbRef, editor);
            newFirepad.setUserName(name);
            setFirepad(newFirepad);
            if (editor.getValue().trim() === "") {
                editor.setValue(code);
            }
        } catch (error) {
            console.error("Error initializing Firepad:", error);
        }
    };

    const handleLanguageChange = (newLanguage: string) => {
        setLanguage(newLanguage);
        if (firepad && firebaseInstance) {
            const userId = firepad.getConfiguration("userId");
            const sanitizedKey = "dsa-code".replace(/[\\.#$\\[\\\]]/g, "");
            const userRef = firebaseInstance.database().ref(`${roomId}/${sanitizedKey}/users/${userId}`);
            userRef.remove();
            firepad.dispose();
            setFirepad(null);
            if (editor) {
                editor.updateOptions({ readOnly: false });
                initializeFirepad();
            }
        }
    };

    useEffect(() => {
        if (!editorLoaded || !editor || !firebaseInstance) {
            console.log("Editor or Firebase not loaded yet");
            return;
        }
        initializeFirepad();
        return () => {
            if (firepad && firebaseInstance) {
                try {
                    const userId = firepad.getConfiguration("userId");
                    const sanitizedKey = "dsa-code".replace(/[\\.#$\\[\\\]]/g, "");
                    const userRef = firebaseInstance.database().ref(`${roomId}/${sanitizedKey}/users/${userId}`);
                    userRef.remove();
                    firepad.dispose();
                } catch (error) {
                    console.error("Error cleaning up Firepad:", error);
                }
            }
        };
    }, [editorLoaded, editor, firebaseInstance]);

    const handleCodeChange = (value: string | undefined) => {
        setCode(value || "");
    };

    async function runCode() {
        const currentCode = editor ? editor.getValue() : code;
        const languageMapping: { [key: string]: number } = {
            javascript: 63,
            cpp: 52,
            python: 71,
            java: 62,
        };
        const languageId = languageMapping[language] || 63;
        const encodedSourceCode = btoa(currentCode);
        const encodedInput = btoa(input);
        const body = {
            source_code: encodedSourceCode,
            language_id: languageId,
            stdin: encodedInput,
        };
        try {
            setOutput("Running code...");
            const response = await fetch(
                "https://judge0-ce.p.rapidapi.com/submissions?base64_encoded=true&wait=true",
                {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                        "x-rapidapi-host": "judge0-ce.p.rapidapi.com",
                        "x-rapidapi-key": process.env.NEXT_PUBLIC_JUDGE0_API_KEY || "",
                    },
                    body: JSON.stringify(body),
                }
            );
            const data = await response.json();
            if (data.stdout) {
                setOutput(atob(data.stdout));
            } else if (data.compile_output) {
                setOutput(data.compile_output ? atob(data.compile_output) : "Compilation error");
            } else if (data.stderr) {
                setOutput(data.stderr ? atob(data.stderr) : "Error");
            } else {
                setOutput("No output");
            }
        } catch (error) {
            console.error("Error executing code:", error);
            setOutput("Error running code: " + (error instanceof Error ? error.message : String(error)));
        }
    };

    useEffect(() => {
        const startLocalStream = async () => {
            try {
                const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
                setLocalStream(stream);
            } catch (err) {
                console.error("Error accessing camera:", err);
            }
        };
        startLocalStream();
    }, []);

    useEffect(() => {
        if (!localStream || !roomId) {
            console.warn("Skipping socket initialization: missing localStream or roomId", { localStream, roomId });
            return;
        }
        const socket = io(process.env.NEXT_PUBLIC_SOCKET_URL || "http://localhost:4000", {
            path: "/socketio",
            transports: ["websocket", "polling"],
        });
        socketRef.current = socket;
        socket.on("connect", () => {
            console.log("Socket.IO connected to", process.env.NEXT_PUBLIC_SOCKET_URL);
        });
        socket.on("connect_error", (error) => {
            console.error("Socket.IO connection error:", error.message);
        });
        socket.on("disconnect", (reason) => {
            console.log("Socket.IO disconnected:", reason);
        });
        const createPeerConnection = () => {
            const pc = new RTCPeerConnection({
                iceServers: [
                    { urls: "stun:stun.l.google.com:19302" },
                    {
                        urls: "turn:openrelay.metered.ca:80",
                        username: "openrelayproject",
                        credential: "openrelayproject",
                    },
                    {
                        urls: "turn:openrelay.metered.ca:443",
                        username: "openrelayproject",
                        credential: "openrelayproject",
                    },
                ],
            });
            localStream.getTracks().forEach((track) => {
                pc.addTrack(track, localStream);
                console.log("Added track:", { kind: track.kind, enabled: track.enabled, readyState: track.readyState });
            });
            pc.onicecandidate = (event) => {
                if (event.candidate) {
                    socket.emit("ice-candidate", { roomId, candidate: event.candidate });
                    console.log("Sent ICE candidate:", event.candidate);
                }
            };
            pc.ontrack = (event) => {
                const [remoteStream] = event.streams;
                console.log("Received remote stream:", remoteStream.getTracks().map((t) => ({ kind: t.kind, enabled: t.enabled, readyState: t.readyState })));
                setRemoteStream(remoteStream);
            };
            pc.oniceconnectionstatechange = () => {
                console.log("ICE connection state:", pc.iceConnectionState);
                if (pc.iceConnectionState === "failed" || pc.iceConnectionState === "disconnected") {
                    console.log("ICE connection failed or disconnected, restarting ICE");
                    pc.restartIce();
                }
            };
            pc.onicegatheringstatechange = () => {
                console.log("ICE gathering state:", pc.iceGatheringState);
            };
            pc.onconnectionstatechange = () => {
                console.log("Connection state:", pc.connectionState);
            };
            return pc;
        };
        let pc = createPeerConnection();
        peerConnectionRef.current = pc;
        socket.emit("join-room", roomId);
        socket.on("room-info", (roomInfo) => {
            const userCount = roomInfo.userCount;
            const role = userCount === 1 ? "Interviewer" : "Candidate";
            setRole(role);
            console.log("Room info:", role, "User count:", userCount);
        });
        socket.on("user-joined", async (socketId) => {
            console.log("User joined:", socketId);
            if (!peerConnectionRef.current || peerConnectionRef.current.signalingState === "closed") {
                console.log("Peer connection closed or null, creating new one");
                pc = createPeerConnection();
                peerConnectionRef.current = pc;
            }
            try {
                const offer = await pc.createOffer();
                await pc.setLocalDescription(new RTCSessionDescription(offer));
                socket.emit("offer", { roomId, offer });
                console.log("Sent offer:", offer);
            } catch (error) {
                console.error("Error creating offer:", error);
            }
        });
        socket.on("offer", async (data) => {
            if (!peerConnectionRef.current || peerConnectionRef.current.signalingState === "closed") {
                console.log("Peer connection closed or null, creating new one for offer");
                pc = createPeerConnection();
                peerConnectionRef.current = pc;
            }
            try {
                await pc.setRemoteDescription(new RTCSessionDescription(data.offer));
                const answer = await pc.createAnswer();
                await pc.setLocalDescription(new RTCSessionDescription(answer));
                socket.emit("answer", { roomId, answer });
                console.log("Sent answer:", answer);
            } catch (error) {
                console.error("Error handling offer:", error);
            }
        });
        socket.on("answer", async (data) => {
            if (!peerConnectionRef.current || peerConnectionRef.current.signalingState === "closed") {
                console.log("Peer connection closed or null, ignoring answer");
                return;
            }
            try {
                await pc.setRemoteDescription(new RTCSessionDescription(data.answer));
            } catch (error) {
                console.error("Error handling answer:", error);
            }
        });
        socket.on("ice-candidate", async (data) => {
            if (!peerConnectionRef.current || peerConnectionRef.current.signalingState === "closed") {
                console.log("Peer connection closed or null, ignoring ICE candidate");
                return;
            }
            try {
                await pc.addIceCandidate(new RTCIceCandidate(data.candidate));
                console.log("Added ICE candidate:", data.candidate);
            } catch (error) {
                console.error("Error adding ICE candidate:", error);
            }
        });
        socket.on("user-disconnected", () => {
            console.log("User disconnected");
            if (peerConnectionRef.current) {
                peerConnectionRef.current.close();
                peerConnectionRef.current = null;
                setRemoteStream(null);
            }
        });
        return () => {
            console.log("Cleaning up socket and peer connection");
            if (peerConnectionRef.current) {
                peerConnectionRef.current.close();
                peerConnectionRef.current = null;
            }
            if (socketRef.current) {
                socketRef.current.off("user-joined");
                socketRef.current.off("offer");
                socketRef.current.off("answer");
                socketRef.current.off("ice-candidate");
                socketRef.current.off("user-disconnected");
                socketRef.current.disconnect();
                socketRef.current = null;
            }
            setRemoteStream(null);
        };
    }, [localStream, roomId]);

    const handleSubmitReport = async () => {
        if (role !== "Interviewer") {
            console.log("Only interviewers can submit reports");
            return;
        }
        setReportDialogOpen(true);
    };

    const handleReportFormSubmit = async () => {
        const report = {
            interviewer_name: role === "Interviewer" ? username || "Unknown" : "",
            candidate_name: role === "Candidate" ? username || "Unknown" : "Candidate",
            question_name: question?.question_name || "Unknown",
            performance_rating: parseInt(reportForm.performanceRating),
            notes: reportForm.notes,
            is_cleared: reportForm.isCleared === "Yes",
        };

        const { data, error } = await supabase
            .from("reports")
            .insert([report])
            .select("*")
            .single();

        if (error) {
            console.error("Failed to submit report:", error.message);
            return;
        }

        if (!data?.id) {
            console.error("Failed to retrieve report ID after insert.");
            return;
        }

        setReportDialogOpen(false);
        router.push(`/reports/${data.id}`);
    };

    return (
        <div className="flex h-screen">
            <ResizablePanelGroup direction="horizontal" className="flex h-full w-full">
                <ResizablePanel className="w-1/4 border p-4 overflow-y-auto">
                    <h2 className="text-2xl font-bold">{question?.question_name}</h2>
                    <ReactMarkdown
                        rehypePlugins={[rehypeHighlight]}
                        components={{
                            h3: ({ children }) => (
                                <h3 className="mt-6 text-xl font-bold">{children}</h3>
                            ),
                            h4: ({ children }) => (
                                <h4 className="mt-6 text-lg font-bold text-white">{children}</h4>
                            ),
                            h5: ({ children }) => (
                                <h5 className="mt-6 text-lg font-bold text-white">{children}</h5>
                            ),
                            strong: ({ children }) => {
                                const text = String(children).toLowerCase();
                                if (["problem statement", "constraints", "example", "input", "output", "explanation", "formula for monthly payment"].includes(text)) {
                                    return (
                                        <span className="block mt-6 text-lg font-bold text-white">
                                            {children}
                                        </span>
                                    );
                                }
                                return <strong>{children}</strong>;
                            },
                            li: ({ children }) => (
                                <li className="mt-2">{children}</li>
                            ),
                            p: ({ children }) => {
                                const text = String(children);
                                if (text.match(/\*\*(M|P|i|n)\*\*/)) {
                                    return <p className="inline">{children}</p>;
                                }
                                return <p className="mt-2">{children}</p>;
                            },
                        }}
                    >
                        {modifiedContent}
                    </ReactMarkdown>
                </ResizablePanel>
                <ResizableHandle />
                <ResizablePanel className="flex-1">
                    <ResizablePanelGroup direction="vertical" className="flex h-full">
                        <ResizablePanel className="flex-1 border p-4">
                            <div className="flex items-center justify-between mb-2">
                                <div className="flex items-center space-x-2">
                                    <label htmlFor="language-select" className="font-medium">
                                        Language:
                                    </label>
                                    <Select
                                        onValueChange={handleLanguageChange}
                                        defaultValue="javascript"
                                    >
                                        <SelectTrigger id="language-select">
                                            {language.toUpperCase()}
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="cpp">C++</SelectItem>
                                            <SelectItem value="python">Python</SelectItem>
                                            <SelectItem value="java">Java</SelectItem>
                                            <SelectItem value="javascript">JavaScript</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                                <div className="flex items-center space-x-2">
                                    <Button
                                        onClick={toggleCamera}
                                        variant="destructive"
                                        className="hover:shadow-[0_20px_50px_rgba(255,0,0,0.7)]"
                                    >
                                        {showCamera ? "Hide Camera" : "Show Camera"}
                                    </Button>
                                    <Button
                                        onClick={toggleWhiteboard}
                                        variant="secondary"
                                        className="m-2 hover:shadow-[0_20px_50px_rgba(0,0,255,0.7)]"
                                    >
                                        Whiteboard
                                    </Button>
                                    <CopyURLButton className="m-2 hover:shadow-[0_20px_50px_rgba(0,255,0,0.7)]" />
                                    <Button
                                        onClick={runCode}
                                        variant="default"
                                        className="m-2 hover:shadow-[0_20px_50px_rgba(255,255,255,0.7)]"
                                    >
                                        Run Code
                                    </Button>
                                    <Button
                                        onClick={handleSubmitReport}
                                        variant="default"
                                        className="m-2 hover:shadow-[0_20px_50px_rgba(255,255,255,0.7)]"
                                    >
                                        Submit
                                    </Button>
                                </div>
                            </div>
                            <div style={{ height: "calc(100% - 40px)" }}>
                                {typeof window !== "undefined" && (
                                    <Editor
                                        height="100%"
                                        language={language}
                                        value={code}
                                        onChange={handleCodeChange}
                                        theme="vs-dark"
                                        onMount={handleEditorDidMount}
                                        options={{
                                            wordWrap: "on",
                                            readOnly: false,
                                            minimap: { enabled: false }
                                        }}
                                    />
                                )}
                            </div>
                        </ResizablePanel>
                        <ResizableHandle />
                        <ResizablePanel className="h-1/3 border p-4">
                            <Tabs defaultValue="input">
                                <TabsList>
                                    <TabsTrigger value="input">Input</TabsTrigger>
                                    <TabsTrigger value="output">Output</TabsTrigger>
                                </TabsList>
                                <TabsContent value="input">
                                    <textarea
                                        className="w-full h-32 p-2 border rounded"
                                        placeholder="Enter test case input here..."
                                        value={input}
                                        onChange={(e) => setInput(e.target.value)}
                                    />
                                </TabsContent>
                                <TabsContent value="output">
                                    <pre className="bg-gray-800 text-white p-2 h-32 overflow-auto rounded">
                                        {output}
                                    </pre>
                                </TabsContent>
                            </Tabs>
                        </ResizablePanel>
                    </ResizablePanelGroup>
                </ResizablePanel>
            </ResizablePanelGroup>
            <div className="absolute top-10 left-10 cursor-move z-50">
                {showCamera && <CameraFeed localStream={localStream} remoteStream={remoteStream} />}
            </div>
            <Dialog open={whiteboardOpen} onOpenChange={setWhiteboardOpen}>
                <DialogContent className="max-w-[95vw] w-3/4 max-h-[90vh] h-[90vh] p-0 overflow-hidden">
                    <DialogHeader className="p-4 border-b">
                        <DialogTitle>Collaborative Whiteboard</DialogTitle>
                    </DialogHeader>
                    <div className="w-full h-[calc(90vh-60px)] overflow-hidden">
                        {whiteboardOpen && (
                            <WhiteBoard roomId={roomId || ''} username={username ?? "User"} />
                        )}
                    </div>
                </DialogContent>
            </Dialog>
            <Dialog open={reportDialogOpen} onOpenChange={setReportDialogOpen}>
                <DialogContent className="sm:max-w-[425px]">
                    <DialogHeader>
                        <DialogTitle>Submit Interview Report</DialogTitle>
                    </DialogHeader>
                    <div className="grid gap-4 py-4">
                        <div className="grid grid-cols-4 items-center gap-4">
                            <Label htmlFor="performanceRating" className="col-span-1">Performance</Label>
                            <Select
                                value={reportForm.performanceRating}
                                onValueChange={(value) => setReportForm({ ...reportForm, performanceRating: value })}
                            >
                                <SelectTrigger id="performanceRating" className="col-span-3">
                                    {reportForm.performanceRating}
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="1">1 - Poor</SelectItem>
                                    <SelectItem value="2">2 - Fair</SelectItem>
                                    <SelectItem value="3">3 - Good</SelectItem>
                                    <SelectItem value="4">4 - Very Good</SelectItem>
                                    <SelectItem value="5">5 - Excellent</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="grid grid-cols-4 items-center gap-4">
                            <Label htmlFor="notes" className="col-span-1">Notes</Label>
                            <Input
                                id="notes"
                                value={reportForm.notes}
                                onChange={(e) => setReportForm({ ...reportForm, notes: e.target.value })}
                                placeholder="Enter any notes about the interview..."
                                className="col-span-3"
                            />
                        </div>
                        <div className="grid grid-cols-4 items-center gap-4">
                            <Label htmlFor="isCleared" className="col-span-1">Cleared</Label>
                            <Select
                                value={reportForm.isCleared}
                                onValueChange={(value) => setReportForm({ ...reportForm, isCleared: value })}
                            >
                                <SelectTrigger id="isCleared" className="col-span-3">
                                    {reportForm.isCleared}
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="Yes">Yes</SelectItem>
                                    <SelectItem value="No">No</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                    </div>
                    <div className="flex justify-end gap-2">
                        <Button variant="outline" onClick={() => setReportDialogOpen(false)}>
                            Cancel
                        </Button>
                        <Button onClick={handleReportFormSubmit}>Submit Report</Button>
                    </div>
                </DialogContent>
            </Dialog>
        </div>
    );
};

export default DsaPlayground;