import Link from "next/link";
import { createClient } from "@/utils/supabase/server";
import { v4 as uuidv4 } from "uuid";

interface PageProps {
    params: Promise<{ category: string }>; // Update to Promise
}

export default async function QuestionsPage({ params }: PageProps) {
    const { category } = await params; // Await the params directly
    const decodedCategory = decodeURIComponent(category);

    if (!category) {
        return (
            <p className="text-red-500 text-center mt-10 dark:text-red-400">
                Invalid category
            </p>
        );
    }

    const supabase = await createClient();
    const { data: questions, error } = await supabase
        .from("questions")
        .select("*")
        .eq("question_category", decodedCategory);

    const generateRandomUID = () => uuidv4();
    const roomId = generateRandomUID();

    if (error) {
        return (
            <p className="text-red-500 text-center mt-10 dark:text-red-400">
                Failed to load questions
            </p>
        );
    }

    return (
        <div className="flex flex-col items-center justify-start min-h-screen px-4 py-10 bg-gray-50 dark:bg-black transition-colors duration-300">
            <h2 className="text-3xl md:text-5xl font-bold mb-10 text-center text-gray-800 dark:text-gray-100">
                {decodedCategory.replaceAll("_", " ").toUpperCase()} Questions
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 w-full max-w-4xl">
                {questions.map((q) => (
                    <Link
                        key={q.id}
                        href={
                            decodedCategory.toLowerCase() === "machine_coding"
                                ? `/interview/${q.question_category}/${q.id}/${roomId}`
                                : `/interview/setup-camera?category=${q.question_category}&questionId=${q.id}&roomId=${roomId}`
                        }
                    >
                        <div className="bg-white dark:bg-zinc-900 rounded-2xl border border-gray-200 dark:border-zinc-800 shadow-sm hover:shadow-md hover:scale-[1.02] transition-all p-6 cursor-pointer">
                            <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100">
                                {q.question_name}
                            </h3>
                        </div>
                    </Link>
                ))}
            </div>
        </div>
    );
}