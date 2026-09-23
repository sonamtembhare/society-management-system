export const API_BASE_URL = "https://society-management-system-api-t9qf.vercel.app/api";

export const STORAGE_KEYS = {
  TOKEN: "@auth_token",
  USER: "@auth_user",
} as const;

export const PAGINATION = {
  DEFAULT_PAGE: 1,
  DEFAULT_LIMIT: 20,
} as const;
