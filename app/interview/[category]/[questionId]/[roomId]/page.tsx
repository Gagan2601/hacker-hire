"use client";

import { useEffect, useState } from "react";
import QuestionPageContent from "./QuestionPageContent";

export default function QuestionPageWrapper({
    params,
}: {
    params: Promise<{ category?: string; questionId?: string; roomId?: string }>;
}) {
    const [resolvedParams, setResolvedParams] = useState<{
        category?: string;
        questionId?: string;
        roomId?: string;
    } | null>(null);

    useEffect(() => {
        // Resolve the params
        params.then(setResolvedParams).catch((err) => {
            console.error("Failed to resolve params:", err);
        });
    }, [params]);

    if (!resolvedParams) {
        return <div>Loading...</div>; // Or some other loading state
    }

    return <QuestionPageContent params={resolvedParams} />;
}