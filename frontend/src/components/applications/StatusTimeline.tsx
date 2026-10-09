import React from "react";
import { differenceInCalendarDays, format } from "date-fns";
import { JobStatusHistory } from "@/types/types";

// Same colours as the status badges
const STATUS_DOT: Record<string, string> = {
    'Applied': 'bg-yellow-700',
    'Screening Interview': 'bg-orange-700',
    'Mid-stage Interview': 'bg-blue-600',
    'Final Interview': 'bg-purple-600',
    'Offer': 'bg-green-700',
    'Rejected': 'bg-red-600',
    'Ghosted': 'bg-gray-600',
};

const describeGap = (days: number) =>
    days <= 0 ? 'Same day' : `${days} day${days === 1 ? '' : 's'} later`;

interface StatusTimelineProps {
    history: JobStatusHistory[];
}

// Every status change of an application, oldest first, with the time between stages
export default function StatusTimeline({ history }: StatusTimelineProps) {
    const entries = [...history].sort((a, b) => new Date(a.changeDate).getTime() - new Date(b.changeDate).getTime());

    if (entries.length === 0) {
        return null;
    }

    return (
        <ol className="relative">
            {entries.map((entry, index) => {
                const date = new Date(entry.changeDate);
                const previous = index > 0 ? new Date(entries[index - 1].changeDate) : null;
                const isLast = index === entries.length - 1;

                return (
                    <li key={entry.id} className="relative flex gap-3 pb-3 last:pb-0">
                        {/* Connector line to the next stage */}
                        {!isLast && <span className="absolute left-[5px] top-4 bottom-0 w-px bg-border" aria-hidden="true" />}
                        <span className={`relative mt-1.5 h-[11px] w-[11px] shrink-0 rounded-full ${STATUS_DOT[entry.status] ?? 'bg-muted-foreground'}`} />
                        <div className="flex flex-wrap items-baseline gap-x-2 text-sm">
                            <span className={isLast ? 'font-semibold text-foreground' : 'text-foreground'}>{entry.status}</span>
                            <span className="text-muted-foreground">{format(date, 'd MMM yyyy')}</span>
                            {previous && (
                                <span className="text-xs text-muted-foreground">· {describeGap(differenceInCalendarDays(date, previous))}</span>
                            )}
                        </div>
                    </li>
                );
            })}
        </ol>
    );
}
