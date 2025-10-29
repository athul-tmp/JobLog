import axios, { AxiosInstance } from "axios";
import { LoginResponse, DashboardAnalytics, JobApplication, CreateJobApplicationRequest, UpdateJobApplicationRequest, ForgotPasswordRequest, ResetPasswordRequest  } from "../types/types";

// C# backend base URL
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5264/api';

const apiClient: AxiosInstance = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    "Content-Type": "application/json",
  },
  withCredentials: true,
});

// Helper to display api error for settings page
const handleApiError = (error: unknown, defaultMessage: string): Promise<never> => {
    if (axios.isAxiosError(error) && error.response) {
        const specificMessage = error.response.data?.message; 
        return Promise.reject(specificMessage || defaultMessage + `. Status: ${error.response.status}`);
    }
    return Promise.reject(defaultMessage + '. An unexpected error occurred.');
};

export const AuthService = {
  // Login method
  login: async (email: string, password: string): Promise<LoginResponse> => {
    try {
      const response = await apiClient.post<LoginResponse>("/User/login", { email, password });
      return response.data;
    } 
    catch (error) {
      if (axios.isAxiosError(error) && error.response) {
        return Promise.reject(error.response.data.message || "Invalid credentials.");
      }
      return Promise.reject("An unexpected error occurred during login.");
    }
  },

  // Registration method 
  register: async (email: string, password: string, firstName: string): Promise<void> => {
    try {
      await apiClient.post("/User/register", { firstName, email, password });
    } catch (error) {
      if (axios.isAxiosError(error) && error.response) {
        return Promise.reject(error.response.data.message || "Registration failed.");
      }
      return Promise.reject("An unexpected error occurred during registration.");
    }
  },

  // Logout method to call backend to clear the HttpOnly cookie
  logout: async (): Promise<void> => { 
      try {
          await apiClient.post("/User/logout");
      } catch (error) {
          console.error("Logout server call failed, proceeding with client-side logout:", error);
      }
  },

  // Update First Name
  updateName: async (data: { currentPassword: string, newFirstName: string }): Promise<void> => {
      try {
          await apiClient.put("/User/updateName", data);
      } catch (error) {
          return handleApiError(error, "Failed to update name.");
      }
  },
  
  // Update Email
  updateEmail: async (data: { currentPassword: string, newEmail: string }): Promise<void> => {
      try {
          await apiClient.put("/User/updateEmail", data);
      } catch (error) {
          return handleApiError(error, "Failed to update email.");
      }
  },
  
  // Update Password
  updatePassword: async (data: { currentPassword: string, newPassword: string }): Promise<void> => {
      try {
          await apiClient.put("/User/updatePassword", data);
      } catch (error) {
          return handleApiError(error, "Failed to update password.");
      }
  },
  
  // Delete Account
  deleteAccount: async (data: { currentPassword: string }): Promise<void> => {
      try {
          await apiClient.delete("/User/delete", { data: data }); 
      } catch (error) {
          return handleApiError(error, "Account deletion failed.");
      }
  },

  // Re-verify password
  verifyPassword: async (data: { currentPassword: string }): Promise<void> => {
      try {
          await apiClient.post("/User/verifyPassword", data);
      } catch (error) {
          return handleApiError(error, "Password verification failed."); 
      }
  },

  // Forgot Password method
  forgotPassword: async (data: ForgotPasswordRequest): Promise<string> => {
    try {
      const response = await apiClient.post<{ message: string }>("/User/forgotPassword", data);
      return response.data.message;
    } catch (error) {
      console.error("Forgot password request failed (but we return success):", error);
      return "If an account exists for this email, a password reset link has been sent.";
    }
  },
  
  // Reset Password method
  resetPassword: async (data: ResetPasswordRequest): Promise<string> => {
    try {
      const response = await apiClient.post<{ message: string }>("/User/resetPassword", data);
      return response.data.message;
    } catch (error) {
        if (axios.isAxiosError(error) && error.response) {
            const message = error.response.data?.message || "Invalid or expired reset link.";
            const details = error.response.data?.details ? `: ${error.response.data.details}` : '';
            return Promise.reject(message + details);
        }
        return Promise.reject("An unexpected error occurred during password reset.");
    }
  },
};

export const JobApplicationService = {
  // Fetch dashboard analytics
  getDashboardAnalytics: async (): Promise<DashboardAnalytics> => {
    try {
      const response = await apiClient.get<DashboardAnalytics>("/Analytics/summary");
      return response.data;
    } catch (error) {
      if (axios.isAxiosError(error) && error.response && error.response.status === 401) {
        throw new Error("Session expired. Please log in again.");
      }
      throw new Error("Failed to fetch dashboard data.");
    }
  },

  // Create new job application
  addJobApplication: async (jobData: CreateJobApplicationRequest): Promise<JobApplication> => {
    try {
      const response = await apiClient.post<JobApplication>("/JobApplication", jobData);
      return response.data;
    } catch (error) {
      if (axios.isAxiosError(error) && error.response) {
        return Promise.reject(error.response.data.message || "Failed to add job application.");
      }
      return Promise.reject("An unexpected error occurred while adding the job.");
    }
  },

  // Fetch all job applications
  getAllJobApplications: async (): Promise<JobApplication[]> => {
    try {
        const response = await apiClient.get<JobApplication[]>("/JobApplication/all");
        return response.data;
    } catch (error) {
        if (axios.isAxiosError(error) && error.response && error.response.status === 401) {
            throw new Error("Session expired. Please log in again.");
        }
        throw new Error("Failed to fetch job applications.");
    }
  },

  // Delete all job applications
  deleteAllApplications: async (data: { currentPassword: string }): Promise<void> => {
    try {
        await apiClient.delete("/JobApplication/all", { data: data }); 
    } catch (error) {
        return handleApiError(error, "Failed to delete all applications.");
    }
  },

  // Update job application
  updateJobApplication: async (jobData: UpdateJobApplicationRequest): Promise<JobApplication> => {
    try {
      const response = await apiClient.put<JobApplication>("/JobApplication", jobData);
      return response.data;
    } catch (error) {
      if (axios.isAxiosError(error) && error.response) {
        return Promise.reject(error.response.data.message || "Failed to update job application.");
      }
      return Promise.reject("An unexpected error occurred while updating the job.");
    }
  },
  
  // Undo previous status change
  undoStatusChange: async (jobId: number): Promise<JobApplication> => {
      try {
          const response = await apiClient.post<JobApplication>(`/JobApplication/undo/${jobId}`);
          return response.data;
      } catch (error) {
          if (axios.isAxiosError(error) && error.response) {
              return Promise.reject(error.response.data.message || "Failed to undo last status change.");
          }
          return Promise.reject("An unexpected error occurred while performing the undo operation.");
      }
  },
};

export default apiClient;