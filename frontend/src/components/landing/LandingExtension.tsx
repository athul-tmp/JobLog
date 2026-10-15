import React from "react";
import Image from "next/image";
import { Check, Chrome } from "lucide-react";
import { Button } from "@/components/ui/button";
import { CHROME_EXTENSION_URL } from "@/lib/links";

const POINTS = [
    "Fills in the role, company, link and location",
    "Warns you if you've already added the job",
    "Ctrl/Cmd+J to open, Ctrl/Cmd+Enter to save",
];

// Landing page showcase for the Quick Add Chrome extension
export default function LandingExtension() {
    return (
        <section id="extension" className="border-t scroll-mt-16">
            <div className="container mx-auto max-w-6xl px-6 py-16 sm:py-20 grid lg:grid-cols-2 gap-12 items-center">
                <div className="text-center lg:text-left">
                    <p className="text-sm font-semibold uppercase tracking-wide text-primary dark:text-purple-400">Chrome extension</p>
                    <h2 className="mt-2 text-3xl sm:text-4xl font-extrabold tracking-tight">Save jobs while you browse</h2>
                    <p className="mt-3 text-muted-foreground max-w-xl mx-auto lg:mx-0">
                        JobLog: Quick Add fills in the job for you on LinkedIn, Seek and Indeed. Check the details and save without leaving the page.
                    </p>

                    <ul className="mt-6 space-y-3 inline-block text-left">
                        {POINTS.map(point => (
                            <li key={point} className="flex items-center gap-3">
                                <span className="flex h-6 w-6 flex-none items-center justify-center rounded-full bg-purple-500/15">
                                    <Check className="h-3.5 w-3.5 text-purple-600 dark:text-purple-400" />
                                </span>
                                {point}
                            </li>
                        ))}
                    </ul>

                    <div className="mt-8 flex flex-col items-center lg:items-start gap-2">
                        <Button asChild size="lg" className="h-12 text-lg px-8 shadow-lg cursor-pointer">
                            <a href={CHROME_EXTENSION_URL} target="_blank" rel="noopener noreferrer">
                                <Chrome className="mr-2 h-5 w-5" /> Add to Chrome
                            </a>
                        </Button>
                        <p className="text-sm text-muted-foreground">Free, for Chrome on desktop. Uses your JobLog account.</p>
                    </div>
                </div>

                <div className="flex justify-center">
                    <div className="w-full max-w-[352px] overflow-hidden rounded-2xl border shadow-2xl">
                        <Image
                            src="/images/extension_light_mode.png"
                            alt="JobLog: Quick Add extension with a job's details filled in"
                            width={704}
                            height={1012}
                            className="w-full h-auto dark:hidden"
                        />
                        <Image
                            src="/images/extension_dark_mode.png"
                            alt="JobLog: Quick Add extension with a job's details filled in"
                            width={704}
                            height={1012}
                            className="w-full h-auto hidden dark:block"
                        />
                    </div>
                </div>
            </div>
        </section>
    );
}
