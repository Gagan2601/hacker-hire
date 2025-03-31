"use client";

import { useEffect, useState } from "react";
import { getUser } from "@/app/actions";
import { createClient } from "@supabase/supabase-js";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableHeader, TableRow, TableHead, TableBody, TableCell } from "@/components/ui/table";
import { User } from "@supabase/supabase-js";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import Link from "next/link";

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export default function InterviewReport() {
    const [user, setUser] = useState<User | null>(null);
    const [reports, setReports] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        async function fetchData() {
            const userData = await getUser();
            setUser(userData);

            if (userData) {
                const { data, error } = await supabase
                    .from("reports")
                    .select("*")
                    .eq("interviewer_email", userData.email);
                if (error) console.error(error);
                else setReports(data);
            }
            setLoading(false);
        }
        fetchData();
    }, []);

    return (
        <div className="max-w-4xl mx-auto mt-10 p-6 bg-gray-800 rounded-lg shadow-md">
            <Card>
                <CardHeader className="bg-blue-800 text-white p-4 rounded-t-lg">
                    <CardTitle className="text-2xl font-bold text-center">Interview Reports</CardTitle>
                </CardHeader>
                <CardContent>
                    {loading ? (
                        <Skeleton className="h-10 w-full my-4" />
                    ) : user ? (
                        <Table className="rounded-lg shadow-lg">
                            <TableHeader>
                                <TableRow className=" text-gray-700">
                                    <TableHead>Interviewer</TableHead>
                                    <TableHead>Candidate</TableHead>
                                    <TableHead>Score</TableHead>
                                    <TableHead>Feedback</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {reports.map((report) => (
                                    <TableRow key={report.id} >
                                        <TableCell className="font-bold text-blue-700">
                                            <Link href={`/reports/${report.id}`}>{report.interviewer_name}</Link>
                                        </TableCell>
                                        <TableCell className="font-bold text-green-700">{report.candidate_name}</TableCell>
                                        <TableCell>
                                            <Badge className={`px-3 py-1 rounded-full ${report.score >= 80 ? 'bg-green-500 text-white' : 'bg-red-500 text-white'}`}>
                                                {report.score}
                                            </Badge>
                                        </TableCell>
                                        <TableCell className="text-gray-400">{report.feedback}</TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    ) : (
                        <p className="text-center text-gray-600">Please log in to view reports.</p>
                    )}
                </CardContent>
            </Card>
        </div>
    );
}
