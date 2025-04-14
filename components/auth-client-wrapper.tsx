"use client";

import { useEffect } from "react";
import { useAuthStore } from "@/store/useAuthStore";
import { Button } from "./ui/button";
import { signOutAction } from "@/app/actions";

export default function AuthClientWrapper({ username }: { username: string }) {
    const { setUsername } = useAuthStore();

    useEffect(() => {
        setUsername(username);
    }, [username, setUsername]);

    return (
        <div className="flex items-center gap-4">
            <span>Hey, {username}!</span>
            <form action={signOutAction}>
                <Button type="submit" variant={"outline"}>
                    Sign out
                </Button>
            </form>
        </div>
    );
}
