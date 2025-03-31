import Link from "next/link";

export default function InterviewPage() {
    return (
        <div className="flex flex-col items-center justify-center min-h-screen w-full font-extrabold">
            <h2 className="text-4xl mb-6">Choose an Option</h2>
            <div className="flex gap-4 w-full">
                <Link href="/interview/give" className="flex-1">
                    <div className="flex text-2xl items-center justify-center border rounded-xl hover:shadow-[0_20px_50px_rgba(8,_112,_184,_0.7)] p-4 w-72 h-40 m-auto  hover:scale-90 ">
                        Give Interview
                    </div>
                </Link>
                <Link href="/interview/take" className="flex-1">
                    <div className="flex text-2xl  items-center justify-center border rounded-xl hover:shadow-[0_20px_50px_rgba(8,_112,_184,_0.7)] p-4 w-72 h-40 m-auto  hover:scale-90 ">
                        Take Interview
                    </div>
                </Link>
            </div>
        </div>
    );
}