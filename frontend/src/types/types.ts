// Authentication
export interface LoginResponse {
  message: string;
  email: string;
  firstName: string;
  tokenExpiration?: string;
  isDemo?: boolean;
}

export interface AuthUser {
  firstName: string;
  email: string;
  isDemo: boolean;
  expiresAt?: number;
}

export interface ForgotPasswordRequest {
  email: string;
}

export interface ResetPasswordRequest {
  email: string;
  token: string;
  newPassword: string;
}

// Job application page
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

// Dashboard page
export interface MonthlyApplications {
  monthYear: string;
  count: number;
}

export interface ApplicationsPerDay {
  date: string;
  count: number;
}

export interface FlowLink {
  from: string;
  to: string;
  count: number;
}

export interface AttentionItem {
  id: number;
  applicationNo: number;
  company: string;
  role: string;
  status: string;
  reason: 'NoReply' | 'InterviewStalled';
  daysSinceUpdate: number;
  jobPostingURL: string | null;
}

export interface SourceBreakdown {
  source: string;
  applications: number;
  interviews: number;
}

export interface ResponseTimes {
  medianDaysToFirstReply: number | null;
  repliesCounted: number;
  medianDaysToFirstInterview: number | null;
  interviewsCounted: number;
}

export interface DashboardAnalytics {
  totalApplications: number;
  totalOffers: number;
  totalRejections: number;
  totalPending: number;
  totalInterviews: number;
  totalGhosted: number;
  previousMonthToDateCount: number;
  previousMonthToDateDays: number;

  monthlyTrend: MonthlyApplications[];
  applicationsPerDay: ApplicationsPerDay[];
  applicationFlow: FlowLink[];
  needsAttention: AttentionItem[];
  sources: SourceBreakdown[];
  responseTimes: ResponseTimes;
}