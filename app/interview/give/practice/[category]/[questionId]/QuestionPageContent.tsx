// app/interview/give/practice/[category]/[questionId]/QuestionPageContent.tsx
"use client";

import { useEffect, useState } from "react";
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs";
import ReactMarkdown from "react-markdown";
import rehypeHighlight from "rehype-highlight";
import "highlight.js/styles/github-dark.css";
import CameraFeed from "@/components/camera-feed";
import { use } from "react";

export default function QuestionPageContent({
    params,
}: {
    params: Promise<{ category?: string; questionId?: string }>;
}) {
    // Unwrap the params Promise using React.use()
    const resolvedParams = use(params);
    const { category, questionId } = resolvedParams;

    const [question, setQuestion] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const supabase = createClientComponentClient();

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

    if (loading) return <p className="text-white">Loading...</p>;
    if (error) return <p className="text-red-500">{error}</p>;
    if (!question) return <p className="text-red-500">Question not found</p>;

    // Remove the first "## question_name" if it exists in readme_content
    let modifiedContent = question.readme_content.replace(
        new RegExp(`^##\\s*${question.question_name}\\s*(\\r?\\n|$)`, "i"),
        ""
    );

    return (
        <div className="grid grid-cols-2 gap-6 p-6">
            {/* Left Side - Question Details */}
            <div className="p-6 border rounded-lg bg-gray-800 text-white">
                <h2 className="text-2xl font-bold">{question.question_name}</h2>

                {/* Render Markdown with uniform styling */}
                <div className="mt-4 markdown-body">
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
            </div>

            {/* Right Side - Compiler and Camera Feed */}
            <div className="p-6 border rounded-lg bg-gray-800">
                {/* Camera Video Feed */}
                <CameraFeed />

                <p className="text-lg text-white">Your camera feed will be monitored.</p>

                {/* Compiler Section */}
                <p className="text-xl mt-6">Compiler will be here</p>
            </div>
        </div>
    );
}