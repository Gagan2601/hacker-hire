"use client";

import { usePathname } from "next/navigation";
import { useEffect } from "react";
import { useCameraStore } from "@/store/useCameraStore";

export default function CameraLayoutManager({ children }: { children: React.ReactNode }) {
    const pathname = usePathname();
    const { stopStream, isActivePage, setIsActivePage } = useCameraStore();

    useEffect(() => {
        const isCameraPage = pathname
            ? pathname.includes("/interview/setup-camera") ||
            pathname.match(/\/interview\/[^/]+\/[^/]+\/[^/]+$/) || pathname.match(/\/interview\/[^/]+\/[^/]+\/[^/]+\/[^/]+$/)
            : false;

        if (!isCameraPage && isActivePage) {
            // We're navigating away from a camera page
            setIsActivePage(false);
            stopStream();
        }
    }, [pathname, isActivePage, setIsActivePage, stopStream]);

    return <>{children}</>;
}