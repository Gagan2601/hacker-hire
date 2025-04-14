import { createClient } from "@supabase/supabase-js";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

interface PageProps {
    params: Promise<{ id: string }>;
}

export default async function SingleReport({ params }: PageProps) {
    const { id } = await params;

    if (!id) {
        return <p className="text-center text-red-600">Report not found.</p>;
    }

    const { data: report, error } = await supabase
        .from("reports")
        .select("*")
        .eq("id", id)
        .single();

    if (error || !report) {
        return <p className="text-center text-red-600">Report not found.</p>;
    }

    return (
        <div className="max-w-2xl mx-auto mt-10 p-6 bg-gray-700 rounded-lg shadow-md">
            <Card>
                <CardHeader className="bg-blue-800 text-white p-4 rounded-t-lg">
                    <CardTitle className="text-2xl font-bold text-center">Interview Report</CardTitle>
                </CardHeader>
                <CardContent className="p-6">
                    <div className="mb-4">
                        <p className="text-lg font-bold text-blue-700">Interviewer: {report.interviewer_name}</p>
                        <p className="text-lg font-bold text-green-700">Candidate: {report.candidate_name}</p>
                        <p className="text-lg font-bold text-green-700">Question: {report.question_name}</p>
                        <p className="text-lg font-bold text-green-700">Cleared: {report.is_cleared ? "Yes" : "No"}</p>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}