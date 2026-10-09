import React, { useState } from "react";
import { CheckCircle, Clock, ExternalLink, MessageSquareWarning } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
    AlertDialog, AlertDialogCancel, AlertDialogContent, AlertDialogDescription,
    AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { JobApplicationService } from "@/services/api";
import { AttentionItem } from "@/types/types";

// Keep in sync with AnalyticsService.NoReplyDays / InterviewStalledDays
const NO_REPLY_DAYS = 30;
const INTERVIEW_STALLED_DAYS = 7;

// How many no-reply applications to show before "Show all"
const NO_REPLY_PREVIEW = 5;

const STAGE_LABELS: Record<string, string> = {
    'Screening Interview': 'screening interview',
    'Mid-stage Interview': 'mid-stage interview',
    'Final Interview': 'final interview',
};

interface NeedsAttentionListProps {
    items: AttentionItem[];
    onChanged: () => void; // refresh the dashboard after an update
}

export default function NeedsAttentionList({ items, onChanged }: NeedsAttentionListProps) {
    const [updatingId, setUpdatingId] = useState<number | null>(null);
    const [showAllNoReply, setShowAllNoReply] = useState(false);
    const [isConfirmOpen, setIsConfirmOpen] = useState(false);
    const [isBulkUpdating, setIsBulkUpdating] = useState(false);

    const stalledInterviews = items.filter(i => i.reason === 'InterviewStalled');
    const noReply = items.filter(i => i.reason === 'NoReply'); // oldest first (from the API)
    const visibleNoReply = showAllNoReply ? noReply : noReply.slice(0, NO_REPLY_PREVIEW);

    const markAsGhosted = async (item: AttentionItem) => {
        setUpdatingId(item.id);
        try {
            await JobApplicationService.updateJobApplication({ id: item.id, status: 'Ghosted' });
            toast.success(`${item.company} marked as Ghosted.`);
            onChanged();
        } catch (error) {
            toast.error("Couldn't update the application.", {
                description: typeof error === 'string' ? error : 'Please try again.',
            });
        } finally {
            setUpdatingId(null);
        }
    };

    const markAllAsGhosted = async () => {
        setIsBulkUpdating(true);
        try {
            const updated = await JobApplicationService.markUnansweredAsGhosted();
            toast.success(`${updated} application${updated === 1 ? '' : 's'} marked as Ghosted.`);
            setIsConfirmOpen(false);
            onChanged();
        } catch (error) {
            toast.error("Couldn't update the applications.", {
                description: typeof error === 'string' ? error : 'Please try again.',
            });
        } finally {
            setIsBulkUpdating(false);
        }
    };

    if (items.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center h-full min-h-[200px] gap-2 text-muted-foreground">
                <CheckCircle className="h-8 w-8 text-green-600" />
                <p className="text-center text-sm">Nothing needs your attention right now.</p>
            </div>
        );
    }

    return (
        <div className="flex flex-col h-full min-h-0">
            <p className="text-xs text-muted-foreground mb-3">
                Interviews with no update for {INTERVIEW_STALLED_DAYS}+ days, and applications with no reply for {NO_REPLY_DAYS}+ days.
            </p>

            {/* Fills the card's height on wide screens without making the row taller; scrolls when longer */}
            <div className="relative lg:flex-1 lg:min-h-[280px]">
                <div className="max-h-[420px] overflow-y-auto pr-1 lg:absolute lg:inset-0 lg:max-h-none">
                    {stalledInterviews.length > 0 && (
                        <section>
                            <h3 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-1">
                                Interviews to follow up ({stalledInterviews.length})
                            </h3>
                            <ul className="divide-y divide-border">
                                {stalledInterviews.map(item => (
                                    <li key={item.id} className="flex items-center justify-between gap-3 py-3">
                                        <ItemText item={item} icon={<MessageSquareWarning className="h-4 w-4 mt-0.5 shrink-0 text-blue-600" />}>
                                            No update for {item.daysSinceUpdate} days since the {STAGE_LABELS[item.status] ?? 'interview'}. Worth a follow-up.
                                        </ItemText>
                                        {item.jobPostingURL && (
                                            <Button size="sm" variant="ghost" asChild className="shrink-0">
                                                <a href={item.jobPostingURL} target="_blank" rel="noopener noreferrer">
                                                    Posting <ExternalLink className="h-3.5 w-3.5 ml-1" />
                                                </a>
                                            </Button>
                                        )}
                                    </li>
                                ))}
                            </ul>
                        </section>
                    )}

                    {noReply.length > 0 && (
                        <section className={stalledInterviews.length > 0 ? 'mt-4' : ''}>
                            <div className="flex items-center justify-between gap-3 mb-1">
                                <h3 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                                    No reply for {NO_REPLY_DAYS}+ days ({noReply.length})
                                </h3>
                                {noReply.length > 1 && (
                                    <Button size="sm" variant="outline" className="cursor-pointer" onClick={() => setIsConfirmOpen(true)}>
                                        Mark all as Ghosted
                                    </Button>
                                )}
                            </div>
                            <ul className="divide-y divide-border">
                                {visibleNoReply.map(item => (
                                    <li key={item.id} className="flex items-center justify-between gap-3 py-3">
                                        <ItemText item={item} icon={<Clock className="h-4 w-4 mt-0.5 shrink-0 text-yellow-600" />}>
                                            Applied {item.daysSinceUpdate} days ago with no reply.
                                        </ItemText>
                                        <Button
                                            size="sm"
                                            variant="outline"
                                            className="shrink-0 cursor-pointer"
                                            disabled={updatingId === item.id}
                                            onClick={() => markAsGhosted(item)}
                                        >
                                            {updatingId === item.id ? 'Updating...' : 'Mark as Ghosted'}
                                        </Button>
                                    </li>
                                ))}
                            </ul>
                            {noReply.length > NO_REPLY_PREVIEW && (
                                <Button
                                    variant="link"
                                    size="sm"
                                    className="px-0 cursor-pointer"
                                    onClick={() => setShowAllNoReply(show => !show)}
                                >
                                    {showAllNoReply ? 'Show fewer' : `Show all ${noReply.length}`}
                                </Button>
                            )}
                        </section>
                    )}
                </div>
            </div>

            {/* Bulk confirmation */}
            <AlertDialog open={isConfirmOpen} onOpenChange={setIsConfirmOpen}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Mark {noReply.length} applications as Ghosted?</AlertDialogTitle>
                        <AlertDialogDescription>
                            Every application with no reply for {NO_REPLY_DAYS}+ days will be marked as Ghosted. You can undo
                            individual applications later from the Applications page.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel disabled={isBulkUpdating}>Cancel</AlertDialogCancel>
                        <Button onClick={markAllAsGhosted} disabled={isBulkUpdating} className="cursor-pointer">
                            {isBulkUpdating ? 'Updating...' : `Mark ${noReply.length} as Ghosted`}
                        </Button>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </div>
    );
}

// Company, role and a one-line explanation
function ItemText({ item, icon, children }: { item: AttentionItem; icon: React.ReactNode; children: React.ReactNode }) {
    return (
        <div className="flex items-start gap-3 min-w-0">
            {icon}
            <div className="min-w-0">
                <p className="text-sm font-medium truncate">
                    {item.company} <span className="text-muted-foreground font-normal">· {item.role}</span>
                </p>
                <p className="text-xs text-muted-foreground">{children}</p>
            </div>
        </div>
    );
}
