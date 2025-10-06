import axios, { AxiosInstance } from "axios";
import { LoginResponse } from "../types/types";

// C# backend base URL
const API_BASE_URL = "http://localhost:5264/api"; 

const apiClient: AxiosInstance = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    "Content-Type": "application/json",
  },
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
        throw new Error(error.response.data.message || "Invalid credentials.");
      }
      throw new Error("An unexpected error occurred during login.");
    }
  },

  // Registration method 
  register: async (email: string, password: string): Promise<void> => {
    try {
      await apiClient.post("/User/register", { email, password });
    } catch (error) {
      if (axios.isAxiosError(error) && error.response) {
        throw new Error(error.response.data.message || "Registration failed.");
      }
      throw new Error("An unexpected error occurred during registration.");
    }
  },
};

// TODO
export const JobApplicationService = {
};

export default apiClient;