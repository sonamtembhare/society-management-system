import { api } from "./api";
import type { ApiResponse, AuthResponse, User } from "../types";

export const authService = {
  async login(email: string, password: string): Promise<ApiResponse<AuthResponse>> {
    return api.post("/auth/login", { email, password });
  },

  async register(data: { name: string; email: string; password: string; role?: string }): Promise<ApiResponse<AuthResponse>> {
    return api.post("/auth/register", data);
  },

  async getMe(): Promise<ApiResponse<User>> {
    return api.get("/auth/me");
  },
};
