import api from "./api";
import { AuthResponse, User, ApiResponse } from "@/src/types";

export const login = async (email: string, password: string): Promise<AuthResponse> => {
  const response = await api.post<ApiResponse<AuthResponse>>("/auth/login", { email, password });
  return response.data.data!;
};

export const register = async (data: {
  name: string;
  email: string;
  password: string;
  role?: string;
}): Promise<AuthResponse> => {
  const response = await api.post<ApiResponse<AuthResponse>>("/auth/register", data);
  return response.data.data!;
};

export const getMe = async (): Promise<User> => {
  const response = await api.get<ApiResponse<User>>("/auth/me");
  return response.data.data!;
};
