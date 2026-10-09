import React from "react";
import Link from "next/link";
import { ArrowRight, Chrome, ClipboardList, Sparkles } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { CHROME_EXTENSION_URL } from "@/lib/links";

const STEPS = [
    {
        icon: ClipboardList,
        title: "Add your first application",
        text: "Log the company, role and link. It takes a few seconds.",
    },
    {
        icon: Chrome,
        title: "Install the Chrome extension",
        text: "Add jobs from LinkedIn, Seek and Indeed in one click while you browse.",
    },
    {
        icon: Sparkles,
        title: "Update statuses as you hear back",
        text: "Your dashboard then shows where applications stand and what needs a follow-up.",
    },
];

// Shown instead of empty charts until the user has at least one application
export default function WelcomeCard() {
    return (
        <Card>
            <CardContent className="py-4 sm:py-6">
                <h2 className="text-xl sm:text-2xl font-bold tracking-tight">Welcome to JobLog</h2>
                <p className="text-muted-foreground mt-1">Your dashboard fills in as you track applications. Here&apos;s how to get started:</p>

                <ol className="grid gap-4 sm:grid-cols-3 mt-6">
                    {STEPS.map((step, index) => (
                        <li key={step.title} className="rounded-lg border p-4">
                            <div className="flex items-center gap-2 text-primary dark:text-purple-400">
                                <step.icon className="h-5 w-5" />
                                <span className="text-xs font-semibold uppercase tracking-wide">Step {index + 1}</span>
                            </div>
                            <p className="font-semibold mt-2">{step.title}</p>
                            <p className="text-sm text-muted-foreground mt-1">{step.text}</p>
                        </li>
                    ))}
                </ol>

                <div className="flex flex-col sm:flex-row gap-3 mt-6">
                    <Button asChild className="cursor-pointer">
                        <Link href="/applications">
                            Add an application <ArrowRight className="h-4 w-4 ml-1" />
                        </Link>
                    </Button>
                    <Button asChild variant="outline" className="cursor-pointer">
                        <a href={CHROME_EXTENSION_URL} target="_blank" rel="noopener noreferrer">
                            <Chrome className="h-4 w-4 mr-1" /> Get the extension
                        </a>
                    </Button>
                </div>
            </CardContent>
        </Card>
    );
}
