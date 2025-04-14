"use client";
import {
    SandpackProvider,
    SandpackLayout,
    FileTabs,
    SandpackStack,
    SandpackPreview,
    SandpackFileExplorer,
    SandpackConsole,
    Sandpack,
} from "@codesandbox/sandpack-react";
import ReactMarkdown from "react-markdown";
import rehypeHighlight from "rehype-highlight";
import "highlight.js/styles/github-dark.css";
import RealtimeEditor from "@/components/editor/mc-editor";
import {
    ResizableHandle,
    ResizablePanel,
    ResizablePanelGroup,
} from "@/components/ui/resizable";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
const WhiteBoard = dynamic(
    () => import("@/components/white-board/white-board"),
    { ssr: false }
);
import { SANDBOX_TEMPLATES } from "@codesandbox/sandpack-react";
import { CopyURLButton } from "@/components/copy-url-button";
import { use, useEffect, useRef, useState } from "react";
import CameraFeed from "@/components/camera-feed";
import dynamic from "next/dynamic";
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs";
import { useCameraStore } from "@/store/useCameraStore";
import { redirect, useRouter } from "next/navigation";
import { useAuthStore } from "@/store/useAuthStore";
import { Button } from "@/components/ui/button";
import { io, Socket } from "socket.io-client";

interface MachineCodingPlaygroundProps {
    params: Promise<{ slug: [TemplateType, string], category: string, questionId: string; }>;
}

type TemplateType = keyof typeof SANDBOX_TEMPLATES;
export default function MachineCodingPlayground({
    params,
}: MachineCodingPlaygroundProps) {
    const router = useRouter();
    const resolvedParams = use(params);
    const template: TemplateType = resolvedParams.slug[0];
    const roomId = resolvedParams.slug[1];
    const { category, questionId } = resolvedParams;
    const { isActivePage } = useCameraStore();
    if (!isActivePage) {
        redirect(`/interview/setup-camera?category=${category}&questionId=${questionId}&template=${template}&roomId=${roomId}`)
    }

    const [question, setQuestion] = useState<any>(null);
    const [whiteboardOpen, setWhiteboardOpen] = useState(false);
    const { username } = useAuthStore();


    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [showCamera, setShowCamera] = useState(true);
    const supabase = createClientComponentClient();

    const { setIsActivePage } = useCameraStore();

    const [localStream, setLocalStream] = useState<MediaStream | null>(null);
    const [remoteStream, setRemoteStream] = useState<MediaStream | null>(null);
    const peerConnectionRef = useRef<RTCPeerConnection | null>(null);
    const [peerConnection, setPeerConnection] = useState<RTCPeerConnection | null>(null);
    const socketRef = useRef<Socket | null>(null);

    const toggleCamera = () => {
        setShowCamera((prev) => !prev);
    };

    const toggleWhiteboard = () => {
        setWhiteboardOpen(!whiteboardOpen);
    };


    useEffect(() => {
        // Set this page as an active camera page
        setIsActivePage(true);

        // Cleanup function to avoid memory leaks
        return () => {
            // We don't want to set isActivePage to false here
            // as it would stop the camera stream when navigating within the app
            // The actual stream cleanup happens in camera-feed.tsx
        };
    }, [setIsActivePage]);

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
        if (!localStream) return;

        const socket = io({
            path: '/api/socketio',
        });
        socketRef.current = socket;

        const pc = new RTCPeerConnection({
            iceServers: [
                {
                    urls: "stun:stun.l.google.com:19302",
                },
            ],
        });

        localStream.getTracks().forEach((track) => pc.addTrack(track, localStream));

        pc.onicecandidate = (event) => {
            if (event.candidate) {
                socket.emit("ice-candidate", { roomId, candidate: event.candidate });
            }
        };

        pc.ontrack = (event) => {
            const [remoteStream] = event.streams;
            setRemoteStream(remoteStream);
        };

        peerConnectionRef.current = pc;
        setPeerConnection(pc);

        socket.emit("join-room", roomId);

        socket.on("user-joined", async (socketId) => {
            const offer = await pc.createOffer();
            await pc.setLocalDescription(new RTCSessionDescription(offer));
            socket.emit("offer", { roomId, offer });
        });

        socket.on("offer", async (data) => {
            await pc.setRemoteDescription(new RTCSessionDescription(data.offer));
            const answer = await pc.createAnswer();
            await pc.setLocalDescription(new RTCSessionDescription(answer));
            socket.emit("answer", { roomId, answer });
        });

        socket.on("answer", async (data) => {
            await pc.setRemoteDescription(new RTCSessionDescription(data.answer));
        });

        socket.on("ice-candidate", async (data) => {
            try {
                await pc.addIceCandidate(new RTCIceCandidate(data.candidate));
            } catch (e) {
                console.error("Error adding received ice candidate", e);
            }
        });

        socket.on("user-disconnected", () => {
            if (peerConnectionRef.current) {
                peerConnectionRef.current.close();
            }
        });

        return () => {
            if (peerConnectionRef.current) {
                peerConnectionRef.current.close();
            }
            socket.off("user-joined");
            socket.off("offer");
            socket.off("answer");
            socket.off("ice-candidate");
            socket.off("user-disconnected");
        };
    }, [localStream]);

    useEffect(() => {
        async function loadQuestion() {
            if (!category || !questionId) {
                setError("Invalid request");
                setLoading(false);
                return;
            }

            try {
                const { data, error } = await supabase
                    .from("questions")
                    .select("*")
                    .eq("id", questionId)
                    .single();

                if (error) throw error;

                setQuestion(data);
                setLoading(false);
            } catch (err: any) {
                setError(err.message || "Failed to load question");
                setLoading(false);
            }
        }

        loadQuestion();
    }, [category, questionId, supabase]);

    useEffect(() => {
        const handleBeforeUnload = (event: BeforeUnloadEvent) => {
            event.preventDefault();
            event.returnValue = "Are you sure you want to leave? Changes may not be saved.";
        };

        const handleRouteChange = () => {
            const confirmation = window.confirm("Are you sure you want to leave this page?");
            if (!confirmation) {
                throw "Route change aborted.";
            }
        };

        window.addEventListener("beforeunload", handleBeforeUnload);
        window.addEventListener("popstate", handleRouteChange);

        return () => {
            window.removeEventListener("beforeunload", handleBeforeUnload);
            window.removeEventListener("popstate", handleRouteChange);
        };
    }, []);

    if (loading) return <p className="text-white">Loading...</p>;
    if (error) return <p className="text-red-500">{error}</p>;
    if (!question) return <p className="text-red-500">Question not found</p>;

    let modifiedContent = question.readme_content.replace(
        new RegExp(`^##\\s*${question.question_name}\\s*(\\r?\\n|$)`, "i"),
        ""
    );

    return (
        <div className="flex h-screen">
            <div className="absolute top-10 left-10 cursor-move z-50">
                {showCamera && <CameraFeed localStream={localStream} remoteStream={remoteStream} />}
            </div>
            <div className="hidden sm:block">
                <div className=" place-self-end">
                    <Button
                        onClick={toggleCamera}
                        variant="destructive"
                        className="m-2 hover:shadow-[0_20px_50px_rgba(255,0,0,0.7)]"
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
                </div>

                <ResizablePanelGroup direction="horizontal">
                    <ResizablePanel className="flex w-1/6 h-[95vh] border p-2">
                        <div className="overflow-y-scroll w-full">
                            <h1 className="text-3xl mb-1 font-semibold tracking-tight">
                                {question.question_name}
                            </h1>
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
                                        <h4 className="mt-6 text-lg font-bold text-white">{children}</h4>
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
                                    li: ({ children }) => {
                                        return <li className="mt-2">{children}</li>;
                                    },
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
                        </div>
                    </ResizablePanel>
                    <ResizableHandle withHandle />
                    <ResizablePanel>
                        <div>
                            <SandpackProvider
                                template={template}
                                theme="dark"
                                style={{ height: "80vh", margin: 0 }}
                            >
                                <SandpackLayout>
                                    <SandpackFileExplorer
                                        style={{ height: "95vh", margin: 0, padding: 5 }}
                                    />
                                    <SandpackStack style={{ height: "95vh", margin: 0 }}>
                                        <RealtimeEditor roomId={roomId} username={username ?? "User"} />
                                    </SandpackStack>
                                    <SandpackStack style={{ height: "95vh", margin: 0 }}>
                                        <SandpackPreview style={{ height: "65vh", margin: 0 }} />
                                        <SandpackConsole style={{ height: "30vh", margin: 0 }} />
                                    </SandpackStack>
                                </SandpackLayout>
                            </SandpackProvider>
                        </div>
                    </ResizablePanel>
                </ResizablePanelGroup>
            </div>
            <div className="sm:hidden min-h-screen flex items-center justify-center font-bold text-2xl">
                <div className="border h-auto flex items-center justify-center p-4 rounded-md shadow-light-blue m-4 text-center">
                    Desktop mode recommended. Certain features may be limited or
                    unavailable on mobile devices.
                </div>
            </div>
            <Dialog open={whiteboardOpen} onOpenChange={setWhiteboardOpen}>
                <DialogContent className="max-w-[95vw] w-3/4 max-h-[90vh] h-[90vh] p-0 overflow-hidden">
                    <DialogHeader className="p-4 border-b">
                        <DialogTitle>Collaborative Whiteboard</DialogTitle>
                    </DialogHeader>
                    <div className="w-full h-[calc(90vh-60px)] overflow-hidden">
                        {whiteboardOpen && (
                            <WhiteBoard roomId={roomId} username={username ?? "user"} />
                        )}
                    </div>
                </DialogContent>
            </Dialog>
        </div>
    );
}
