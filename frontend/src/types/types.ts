// Authentication
export interface LoginResponse {
  message: string;
  userId: number; 
  email: string;
  firstName: string;
  token: string; 
}

export interface AuthUser {
  userId: number;
  email: string;
  firstName: string;
}

// Job application tracker page
export interface JobStatusHistory {
  id: number;
  status: string;
  changeDate: string; 
}

export interface JobApplication {
  id: number;
  applicationNo: number;
  company: string;
  role: string;
  status: string;
  jobPostingURL: string;
  notes: string | null;
  dateApplied: string;
  statusHistory: JobStatusHistory[];
}

export interface CreateJobApplicationRequest {
  company: string;
  role: string;
  jobPostingURL: string;
  notes: string; 
}

export interface UpdateJobApplicationRequest {
  id: number;
  company?: string;
  role?: string;
  jobPostingURL?: string;
  notes?: string;
  status?: string; 
}

// Dashbooard page
export interface InterviewBreakdown {
  type: string;
  count: number;
}

export interface MonthlyApplications {
  monthYear: string;
  count: number;
}

export interface ApplicationsPerDay {
  date: string;
  count: number;
}

export interface DashboardAnalytics {
  totalApplications: number;
  totalOffers: number;
  totalRejections: number;
  totalPending: number;
  totalInterviews: number;
  totalGhosted: number;
  totalPastInterviews: number;
  
  interviewedAndRejected: number;
  interviewedAndGhosted: number;

  interviewTypeBreakdown: InterviewBreakdown[];
  monthlyTrend: MonthlyApplications[];
  applicationsPerDay: ApplicationsPerDay[];
}