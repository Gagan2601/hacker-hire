// app/interview/give/practice/[category]/[questionId]/QuestionPageContent.tsx
"use client";

import { useEffect, useState } from "react";
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs";
import "highlight.js/styles/github-dark.css";
import { use } from "react";
import DsaPlayground from "@/components/editor/dsa-editor";
import { v4 as uuidv4 } from "uuid";
import Link from "next/link";


export default function QuestionPageContent({
    params,
}: {
    params: Promise<{ category?: string; questionId?: string }>;
}) {
    // Unwrap the params Promise using React.use()
    const templates = [
        "static",
        "angular",
        "react",
        "react-ts",
        "solid",
        "svelte",
        "vanilla-ts",
        "vanilla",
        "vue",
        "vue-ts",
        "node",
        "nextjs",
        "vite",
        "vite-react",
        "vite-react-ts",
        "vite-vue",
        "vite-vue-ts",
        "vite-svelte",
        "vite-svelte-ts",
        "astro",
    ];
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

    const generateRandomUID = () => {
        return uuidv4();
    };

    const getLinkPath = (template: string) => {
        const roomId = generateRandomUID();
        return `/interview/setup-camera?category=${category}&questionId=${questionId}&template=${template}&roomId=${roomId}`;
    };

    return (
        <>
            {category === "DSA" ? (
                <DsaPlayground modifiedContent={modifiedContent} question={question} category={category}
                    questionId={questionId} />
            ) : (
                <div className="min-h-screen ">
                    <div className="flex justify-center my-11">
                        <h1 className="text-4xl font-extrabold tracking-tight lg:text-5xl">
                            Choose Playground
                        </h1>
                    </div>
                    <div className="flex justify-center my-10">
                        <div className="flex flex-wrap gap-11 w-4/5 flex-col  justify-center md:flex-row">
                            {templates.map((template) => (
                                <Link
                                    key={template}
                                    href={getLinkPath(template)}
                                >
                                    <div className="flex items-center justify-center border rounded-lg hover:shadow-[0_20px_50px_rgba(8,_112,_184,_0.7)] p-4 w-4/5 h-24 m-auto  hover:scale-90  md:w-48">
                                        <h2 className="text-lg font-semibold">{template}</h2>
                                    </div>
                                </Link>
                            ))}
                        </div>
                    </div>
                </div>
            )
            }
        </>
    );
}