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