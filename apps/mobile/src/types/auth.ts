export interface ApiResponse<T = unknown> {
  success: boolean;
  message: string;
  data?: T;
}

export interface User {
  id: number;
  name: string;
  email: string;
  role: "ADMIN" | "RESIDENT" | "SECURITY";
  phone?: string | null;
  created_at: string;
  updated_at: string;
}

export interface AuthResponse {
  user: User;
  token: string;
}
