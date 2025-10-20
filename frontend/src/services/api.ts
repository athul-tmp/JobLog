import axios, { AxiosInstance, AxiosError, InternalAxiosRequestConfig } from "axios";
import { LoginResponse, DashboardAnalytics, JobApplication, CreateJobApplicationRequest, UpdateJobApplicationRequest  } from "../types/types";

// C# backend base URL
const API_BASE_URL = "http://localhost:5264/api"; 

const apiClient: AxiosInstance = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    "Content-Type": "application/json",
  },
  withCredentials: true,
});

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
  }
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
  deleteAllApplications: async (): Promise<void> => {
    try {
        await apiClient.delete("/JobApplication/all"); 
    } catch (error) {
        if (axios.isAxiosError(error) && error.response) {
            return Promise.reject(error.response.data.message || "Failed to delete all applications.");
        }
        return Promise.reject("An unexpected error occurred while clearing data.");
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
  }
};

export default apiClient;