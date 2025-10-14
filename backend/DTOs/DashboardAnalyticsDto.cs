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

        // Interview but Rejection/Ghosted Breakdown
        int InterviewedAndRejected,
        int InterviewedAndGhosted,

        // Chart Data
        List<MonthlyApplications> MonthlyTrend,
        List<InterviewBreakdown> InterviewTypeBreakdown
    );
}