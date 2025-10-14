export interface LoginResponse {
  message: string;
  userId: number; 
  email: string;
  token: string; 
}

export interface AuthUser {
  userId: number;
  email: string;
}

export interface JobStatusHistory {
  id: number;
  status: string;
  changeDate: string; 
}

export interface JobApplication {
  id: number;
  company: string;
  role: string;
  status: string;
  jobPostingURL: string;
  notes: string | null;
  dateApplied: string;
  statusHistory: JobStatusHistory[];
}
export interface InterviewBreakdown {
  type: string;
  count: number;
}

export interface MonthlyApplications {
  monthYear: string;
  count: number;
}

export interface DashboardAnalytics {
  totalApplications: number;
  totalOffers: number;
  totalRejections: number;
  totalPending: number;
  totalInterviews: number;
  totalGhosted: number;
  
  interviewedAndRejected: number;
  interviewedAndGhosted: number;

  interviewTypeBreakdown: InterviewBreakdown[];
  monthlyTrend: MonthlyApplications[];
}