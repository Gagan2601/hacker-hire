import { setUsernameAction } from "@/app/actions";
import { FormMessage, Message } from "@/components/form-message";
import { WarpBackground } from "@/components/magicui/warp-background";
import { SubmitButton } from "@/components/submit-button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export default async function SetUsernamePage(props: { searchParams: Promise<Message> }) {
    const searchParams = await props.searchParams;

    return (
        <WarpBackground className="flex flex-col items-center justify-center h-full w-full absolute">
            <form className="flex-1 flex flex-col min-w-64">
                <h1 className="text-2xl font-medium">Set Your Username</h1>
                <p className="text-sm text-foreground">
                    Choose a unique username to continue.
                </p>
                <div className="flex flex-col gap-2 [&>input]:mb-3 mt-8">
                    <Label htmlFor="username">Username</Label>
                    <Input name="username" placeholder="Enter your username" required />
                    <SubmitButton pendingText="Setting Username..." formAction={setUsernameAction}>
                        Set Username
                    </SubmitButton>
                    <FormMessage message={searchParams} />
                </div>
            </form>
        </WarpBackground>
    );
}
