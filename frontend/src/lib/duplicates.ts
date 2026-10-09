import { JobApplication } from "@/types/types";

// Reduces a job posting URL to a stable key, so the same job matches across search and detail pages.
// Keep in sync with jobKey() in extension/popup.js.
export function jobKey(url: string): string | null {
    try {
        const parsed = new URL(url);
        const host = parsed.hostname;
        let id: string | null | undefined = null;

        if (host.includes("linkedin.")) {
            id = parsed.pathname.match(/\/jobs\/view\/(?:[^/]*-)?(\d+)/)?.[1] || parsed.searchParams.get("currentJobId");
        } else if (host.includes("seek.")) {
            id = parsed.pathname.match(/\/job\/(\d+)/)?.[1] || parsed.searchParams.get("jobId");
        } else if (host.includes("indeed.")) {
            id = parsed.searchParams.get("jk") || parsed.searchParams.get("vjk");
        }

        if (id) {
            return `${host.replace(/^www\./, "").split(".")[0]}:${id}`;
        }
        return (host.replace(/^www\./, "") + parsed.pathname.replace(/\/$/, "")).toLowerCase();
    } catch {
        return null;
    }
}

const sameText = (a: string | null | undefined, b: string | null | undefined) =>
    (a || "").trim().toLowerCase() === (b || "").trim().toLowerCase();

// Finds an existing application for the same job: by posting URL first, then by company and role
export function findDuplicate(
    applications: JobApplication[],
    job: { company?: string; role?: string; jobPostingURL?: string },
): JobApplication | undefined {
    const key = job.jobPostingURL ? jobKey(job.jobPostingURL) : null;
    const byUrl = key ? applications.find(app => app.jobPostingURL && jobKey(app.jobPostingURL) === key) : undefined;
    if (byUrl) return byUrl;

    if (!job.company?.trim() || !job.role?.trim()) return undefined;
    return applications.find(app => sameText(app.company, job.company) && sameText(app.role, job.role));
}
