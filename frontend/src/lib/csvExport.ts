import { JobApplication } from "@/types/types";

// Escapes a value for CSV and neutralises spreadsheet formula injection
const toCsvCell = (value: string | number | null | undefined): string => {
    let text = value === null || value === undefined ? '' : String(value);

    if (/^[=+\-@\t\r]/.test(text)) {
        text = `'${text}`;
    }

    return /[",\r\n]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text;
};

const formatDate = (iso: string): string => iso ? iso.substring(0, 10) : '';

// Builds a CSV string from the user's job applications
export const buildApplicationsCsv = (applications: JobApplication[]): string => {
    const headers = ['Application No', 'Company', 'Role', 'Status', 'Date Applied', 'Job Posting URL', 'Notes', 'Status History'];

    const rows = [...applications]
        .sort((a, b) => a.applicationNo - b.applicationNo)
        .map(app => [
            app.applicationNo,
            app.company,
            app.role,
            app.status,
            formatDate(app.dateApplied),
            app.jobPostingURL,
            app.notes,
            [...(app.statusHistory ?? [])]
                .sort((a, b) => a.changeDate.localeCompare(b.changeDate))
                .map(h => `${h.status} (${formatDate(h.changeDate)})`)
                .join(' > '),
        ]);

    return [headers, ...rows].map(row => row.map(toCsvCell).join(',')).join('\r\n');
};

// Triggers a browser download of the CSV (BOM added so Excel reads UTF-8 correctly)
export const downloadCsv = (csv: string, filename: string): void => {
    const blob = new Blob(['﻿' + csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
};
