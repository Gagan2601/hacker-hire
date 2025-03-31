"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { createClient } from "@supabase/supabase-js";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export default function SingleReport() {
    const { id } = useParams();
    const [report, setReport] = useState<any | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!id) return;

        async function fetchReport() {
            const { data, error } = await supabase
                .from("reports")
                .select("*")
                .eq("id", id)
                .single();
            if (error) console.error(error);
            else setReport(data);
            setLoading(false);
        }

        fetchReport();
    }, [id]);

    if (loading) {
        return <Skeleton className="h-40 w-full my-4" />;
    }

    if (!report) {
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
                    </div>
                    <div className="mb-4">
                        <p className="text-lg">
                            <span className="font-semibold">Score: </span>
                            <Badge className={`px-3 py-1 rounded-full ${report.score >= 80 ? 'bg-green-500 text-white' : 'bg-red-500 text-white'}`}>
                                {report.score}
                            </Badge>
                        </p>
                    </div>
                    <div>
                        <p className="text-lg font-semibold">Feedback:</p>
                        <p className="text-gray-400">{report.feedback}</p>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
