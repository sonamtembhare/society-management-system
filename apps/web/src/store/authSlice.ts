import { createSlice, PayloadAction } from "@reduxjs/toolkit";
import { User } from "@/src/types";

export interface AuthState {
  user: User | null;
  token: string | null;
  role: string | null;
  isAuthenticated: boolean;
  loading: boolean;
}

const initialState: AuthState = {
  user: null,
  token: typeof window !== "undefined" ? localStorage.getItem("token") : null,
  role: null,
  isAuthenticated: typeof window !== "undefined" ? !!localStorage.getItem("token") : false,
  loading: false,
};

const authSlice = createSlice({
  name: "auth",
  initialState,
  reducers: {
    setCredentials: (state, action: PayloadAction<{ user: User; token: string }>) => {
      state.user = action.payload.user;
      state.token = action.payload.token;
      state.role = action.payload.user.role;
      state.isAuthenticated = true;
      state.loading = false;
      if (typeof window !== "undefined") {
        localStorage.setItem("token", action.payload.token);
      }
    },
    setUser: (state, action: PayloadAction<User>) => {
      state.user = action.payload;
      state.role = action.payload.role;
      state.isAuthenticated = true;
      state.loading = false;
    },
    logout: (state) => {
      state.user = null;
      state.token = null;
      state.role = null;
      state.isAuthenticated = false;
      state.loading = false;
      if (typeof window !== "undefined") {
        localStorage.removeItem("token");
      }
    },
    setLoading: (state, action: PayloadAction<boolean>) => {
      state.loading = action.payload;
    },
  },
});

export const { setCredentials, setUser, logout, setLoading } = authSlice.actions;
export default authSlice.reducer;
