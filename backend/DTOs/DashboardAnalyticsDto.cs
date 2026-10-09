namespace backend.DTOs
{
    // DTO for charting: Monthly trend data
    public record MonthlyApplications(
        string MonthYear,
        int Count
    );

    // DTO for charting: Daily data
    public record ApplicationsPerDay(
        string Date,
        int Count
    );

    // DTO for charting: One link of the application flow (Sankey) chart.
    // Node keys: applications, awaiting, rejectedNoInterview, ghostedNoInterview,
    // screening, midStage, final, offer, rejected, ghosted, inProgress
    public record FlowLink(
        string From,
        string To,
        int Count
    );

    // An application the user may want to act on
    public record AttentionItem(
        int Id,
        int ApplicationNo,
        string Company,
        string Role,
        string Status,
        string Reason,          // "NoReply" (applied, no response) or "InterviewStalled" (no update at an interview stage)
        int DaysSinceUpdate,
        string? JobPostingURL
    );

    // Applications and interviews per job board, derived from the job posting URL
    public record SourceBreakdown(
        string Source,
        int Applications,
        int Interviews
    );

    // Typical (median) days from applying to a company's first reply and to the first interview
    public record ResponseTimes(
        double? MedianDaysToFirstReply,
        int RepliesCounted,
        double? MedianDaysToFirstInterview,
        int InterviewsCounted
    );

    // DTO to hold all calculated statistics and chart data
    public record DashboardAnalyticsDto(
        // Direct Counts
        int TotalApplications,
        int TotalOffers,
        int TotalRejections,
        int TotalPending,        // Status == "Applied"
        int TotalInterviews,     // Currently at an interview stage
        int TotalGhosted,        // Status == "Ghosted"

        // Applications in the same days of last month (1st to today's day), for a fair month-to-date comparison
        int PreviousMonthToDateCount,
        int PreviousMonthToDateDays,

        // Chart Data
        List<MonthlyApplications> MonthlyTrend,
        List<ApplicationsPerDay> ApplicationsPerDay,
        List<FlowLink> ApplicationFlow,
        List<AttentionItem> NeedsAttention,
        List<SourceBreakdown> Sources,
        ResponseTimes ResponseTimes
    );
}
