// app/interview/give/practice/[category]/[questionId]/page.tsx
"use client";

import { useEffect } from "react";
import { useCameraStore } from "@/store/useCameraStore";
import QuestionPageContent from "./QuestionPageContent";

export default function QuestionPageWrapper({
    params,
}: {
    params: Promise<{ category?: string; questionId?: string }>;
}) {
    const { setIsActivePage } = useCameraStore();

    useEffect(() => {
        // Set this page as an active camera page
        setIsActivePage(true);

        return () => {
            // When leaving this page, the cleanup will happen in CameraFeed
        };
    }, [setIsActivePage]);

    return <QuestionPageContent params={params} />;
}