import Link from "next/link";
import { createClient } from "@/utils/supabase/server";

export default async function QuestionsPage({
    children,
    params,
}: Readonly<{ children: React.ReactNode; params: { category?: string } }>) {
    const awaitedParams = await params;
    const categoryParam = awaitedParams?.category;

    if (!categoryParam) {
        return <p className="text-red-500">Invalid category</p>;
    }

    const category = decodeURIComponent(categoryParam);
    const supabase = await createClient();

    const { data: questions, error } = await supabase
        .from("questions")
        .select("*")
        .eq("question_category", category);

    if (error) return <p className="text-red-500">Failed to load questions</p>;

    return (
        <div className="flex flex-col items-center justify-center min-h-screen">
            <h2 className="text-4xl mb-6">{category.toUpperCase()} Questions</h2>
            <div className="flex flex-col gap-4 w-full max-w-2xl">
                {questions.map((q) => (
                    <Link
                        key={q.id}
                        href={`/interview/setup-camera?category=${q.question_category}&questionId=${q.id}`}
                    >
                        <div className="p-4 border rounded-lg hover:bg-gray-100 cursor-pointer">
                            {q.question_name}
                        </div>
                    </Link>
                ))}
            </div>
        </div>
    );
}
