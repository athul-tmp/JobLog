import React from "react";
import { ResponseTimes } from "@/types/types";

const formatDays = (days: number) => {
    const rounded = Math.round(days);
    if (rounded === 0) return "Same day";
    return `${rounded} day${rounded === 1 ? "" : "s"}`;
};

interface ResponseTimeSummaryProps {
    data: ResponseTimes;
}

// Typical (median) wait from applying to a company's first reply, and to the first interview
export default function ResponseTimeSummary({ data }: ResponseTimeSummaryProps) {
    const stats = [
        {
            label: "First reply",
            value: data.medianDaysToFirstReply,
            note: `Based on ${data.repliesCounted} ${data.repliesCounted === 1 ? "reply" : "replies"} (interviews, offers and rejections)`,
        },
        {
            label: "First interview",
            value: data.medianDaysToFirstInterview,
            note: `Based on ${data.interviewsCounted} ${data.interviewsCounted === 1 ? "application" : "applications"} that reached an interview`,
        },
    ];

    return (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            {stats.map(stat => (
                <div key={stat.label}>
                    <p className="text-sm text-muted-foreground">Typical time to {stat.label.toLowerCase()}</p>
                    <p className="text-2xl font-bold text-foreground">
                        {stat.value === null ? "Not enough data yet" : formatDays(stat.value)}
                    </p>
                    {stat.value !== null && <p className="text-xs text-muted-foreground mt-1">{stat.note}</p>}
                </div>
            ))}
        </div>
    );
}
