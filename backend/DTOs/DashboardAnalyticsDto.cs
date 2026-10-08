namespace backend.DTOs
{
    // DTO for charting: Breakdown of interviews by type
    public record InterviewBreakdown(
        string Type,
        int Count
    );

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

    // DTO to hold all calculated statistics and chart data
    public record DashboardAnalyticsDto(
        // Direct Counts
        int TotalApplications,
        int TotalOffers,
        int TotalRejections,

        // Complex Counts
        int TotalPending,        // Status == "Applied"
        int TotalInterviews,     // Total of all interview stages
        int TotalGhosted,        // Status == "Ghosted"
        int TotalPastInterviews, // Status history == "Screening Interview" / "Interview" / "Final Interview"

        // Interview but Rejection/Ghosted Breakdown
        int InterviewedAndRejected,
        int InterviewedAndGhosted,

        // Applications (not stages) that reached an interview, for the flow chart
        int InterviewedApplications,
        int OffersAfterInterview,

        // Applications in the same days of last month (1st to today's day), for a fair month-to-date comparison
        int PreviousMonthToDateCount,

        // Chart Data
        List<InterviewBreakdown> HistoricalInterviewBreakdown,
        List<MonthlyApplications> MonthlyTrend,
        List<InterviewBreakdown> InterviewTypeBreakdown,
        List<ApplicationsPerDay> ApplicationsPerDay
    );
}