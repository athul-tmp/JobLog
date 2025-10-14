import axios, { AxiosInstance, AxiosError, InternalAxiosRequestConfig } from "axios";
import { LoginResponse, DashboardAnalytics } from "../types/types";

// C# backend base URL
const API_BASE_URL = "http://localhost:5264/api"; 

const TOKEN_KEY = "joblog_jwt_token";

const apiClient: AxiosInstance = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    "Content-Type": "application/json",
  },
});

apiClient.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    // Retrieve token from localStorage
    const token = localStorage.getItem(TOKEN_KEY);
    // Attach it to the request header
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error: AxiosError) => {
    return Promise.reject(error);
  }
);

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
  register: async (email: string, password: string): Promise<void> => {
    try {
      await apiClient.post("/User/register", { email, password });
    } catch (error) {
      if (axios.isAxiosError(error) && error.response) {
        return Promise.reject(error.response.data.message || "Registration failed.");
      }
      return Promise.reject("An unexpected error occurred during registration.");
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

  // TODO: Job applications
};

export default apiClient;