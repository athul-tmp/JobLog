import React from "react";
import Link from "next/link";
import { BellRing, Chrome, Clock, GitBranch, LineChart, ShieldCheck, Workflow } from "lucide-react";

const GITHUB_URL = "https://github.com/athul-tmp/JobLog";

const FEATURES = [
    {
        icon: Workflow,
        title: "See where applications go",
        text: "Follow every application from applied to offer, and spot the stage where things stall.",
    },
    {
        icon: BellRing,
        title: "Know what needs a follow-up",
        text: "Interviews that have gone quiet and applications with no reply are flagged for you.",
    },
    {
        icon: Chrome,
        title: "Add jobs in one click",
        text: "The Chrome extension saves jobs from LinkedIn, Seek and Indeed while you browse.",
    },
    {
        icon: Clock,
        title: "Job boards and response times",
        text: "See which boards you apply through and how long companies usually take to reply.",
    },
    {
        icon: LineChart,
        title: "Stay consistent",
        text: "A daily trend shows your pace this month compared with the same days last month.",
    },
    {
        icon: ShieldCheck,
        title: "Your data, your control",
        text: "Export everything to CSV at any time, or delete your account and data whenever you like.",
    },
];

// Feature overview and the free / open source / private message for the landing page
export default function LandingFeatures() {
    return (
        <>
            <section className="border-t bg-muted/30">
                <div className="container mx-auto max-w-6xl px-6 py-16 sm:py-20">
                    <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-center">
                        Everything you need to run your job search
                    </h2>
                    <p className="mt-3 text-center text-muted-foreground max-w-2xl mx-auto">
                        JobLog turns a pile of applications into a clear picture of what&apos;s working and what to do next.
                    </p>

                    <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                        {FEATURES.map(feature => (
                            <div key={feature.title} className="rounded-xl border bg-card p-6">
                                <feature.icon className="h-6 w-6 text-purple-500" />
                                <h3 className="mt-4 font-semibold text-lg">{feature.title}</h3>
                                <p className="mt-2 text-sm text-muted-foreground">{feature.text}</p>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            <section className="border-t">
                <div className="container mx-auto max-w-4xl px-6 py-14 text-center">
                    <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight">Free, open source and private</h2>
                    <p className="mt-3 text-muted-foreground">
                        JobLog is free to use and its code is open source. There are no ads and no tracking, and your data is never sold.
                    </p>
                    <div className="mt-6 flex flex-col sm:flex-row items-center justify-center gap-x-6 gap-y-3 text-sm font-medium">
                        <a
                            href={GITHUB_URL}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center text-muted-foreground hover:text-foreground transition-colors"
                        >
                            <GitBranch className="mr-2 h-4 w-4 text-purple-500" />
                            View the code on GitHub
                        </a>
                        <Link
                            href="/privacy&terms"
                            className="inline-flex items-center text-muted-foreground hover:text-foreground transition-colors"
                        >
                            <ShieldCheck className="mr-2 h-4 w-4 text-purple-500" />
                            Read the privacy policy
                        </Link>
                    </div>
                </div>
            </section>
        </>
    );
}
