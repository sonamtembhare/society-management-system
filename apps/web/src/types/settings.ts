export interface ApiResponse<T = unknown> {
  success: boolean;
  message: string;
  data: T;
}

export interface Setting {
  id: number;
  key: string;
  value: string;
  description: string | null;
  created_at: string;
  updated_at: string;
}

export interface AppSettings {
  rates: Record<string, number>;
  lateFee: number;
  dueDay: number;
  currency: string;
}

export interface UpdateSettingsRequest {
  settings: { key: string; value: string; description?: string }[];
}
