// components/conditional-header-auth.tsx
import { headers } from 'next/headers';
import HeaderAuth from "@/components/header-auth";

export default async function ConditionalHeaderAuth() {
    const headersList = await headers();
    const url = headersList.get('referer') || '';  // Get the full URL from 'referer' header
    const pathname = new URL(url).pathname;  // Extract pathname from the full URL

    // Check if current page is a camera page
    console.log(pathname);
    const isCameraPage =
        pathname.includes('/interview/setup-camera') ||
        pathname.match(/\/interview\/give\/practice\/[^/]+\/[^/]+$/);

    console.log(isCameraPage);

    // Don't render the header auth on camera pages
    if (isCameraPage) {
        return null;
    }

    // Render normal header auth on non-camera pages
    return <HeaderAuth />;
}
