import { createSlice, PayloadAction, createAsyncThunk } from "@reduxjs/toolkit";

export interface User {
  id: number;
  userId?: string;
  name: string;
  email: string;
  phone?: string;
  address?: string;
  password?: string;
  status: string;
  role_id: number; // Changed from 'role' to 'role_id'
  created_at?: string; // For backward compatibility
  updated_at?: string; // For backward compatibility
  Roles: {
    id: number;
    name: string;
  }
}

interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  initialized: boolean;
  error: string | null;
}

// Async thunk to fetch user data
export const fetchUserData = createAsyncThunk(
  "auth/fetchUserData",
  async (_, { rejectWithValue }) => {
    try {
      const token = localStorage.getItem("token");

      if (!token) {
        return rejectWithValue("No token found");
      }

      const response = await fetch("/api/auth/me", {
        method: "GET",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });

      if (!response.ok) {
        throw new Error("Failed to fetch user data");
      }

      const data = await response.json();
      return data;
    } catch (error: any) {
      return rejectWithValue(error.message || "Failed to fetch user");
    }
  }
);

// Check for token in localStorage
const getInitialToken = () => {
  if (typeof window === "undefined") return null;
  return localStorage.getItem("token");
};

const getInitialUser = (): User | null => {
  if (typeof window === "undefined") return null;
  const userStr = localStorage.getItem("user");
  if (userStr) {
    try {
      return JSON.parse(userStr);
    } catch (error) {
      console.error("Error parsing stored user:", error);
      return null;
    }
  }
  return null;
};

const initialState: AuthState = {
  user: getInitialUser(),
  token: getInitialToken(),
  isAuthenticated: !!getInitialToken(),
  isLoading: true,
  initialized: false,
  error: null,
};

const authSlice = createSlice({
  name: "auth",
  initialState,
  reducers: {
    setCredentials: (
      state,
      action: PayloadAction<{ user: any; token: string }>
    ) => {
      const { user, token } = action.payload;

      // The backend returns role as a string
      const normalizedUser: User = {
        id: user.id,
        name: user.name,
        email: user.email,
        role_id: user.role_id || user.role || 0, // Directly use the string role
        status: user.status || "Active",
        created_at: user.createdAt || user.created_at,
        updated_at: user.updatedAt || user.updated_at,
        phone: user.phone,
        address: user.address,
        userId: user.userId || user.user_id,
        Roles: {
          id: 0,
          name: ""
        }
      };

      state.user = normalizedUser;
      state.token = token;
      state.isAuthenticated = true;
      state.isLoading = false;
      state.initialized = true;

      if (typeof window !== "undefined") {
        localStorage.setItem("token", token);
        localStorage.setItem("user", JSON.stringify(normalizedUser));
      }
    },
    logout: (state) => {
      state.user = null;
      state.token = null;
      state.isAuthenticated = false;
      state.isLoading = false;
      state.initialized = true;
      state.error = null;

      if (typeof window !== "undefined") {
        localStorage.removeItem("token");
        localStorage.removeItem("user");
      }
    },
    setLoading: (state, action: PayloadAction<boolean>) => {
      state.isLoading = action.payload;
    },
    updateUser: (state, action: PayloadAction<Partial<User>>) => {
      if (state.user) {
        state.user = { ...state.user, ...action.payload };
        if (typeof window !== "undefined") {
          localStorage.setItem("user", JSON.stringify(state.user));
        }
      }
    },
    setInitialized: (state) => {
      state.initialized = true;
    },
    clearError: (state) => {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchUserData.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchUserData.fulfilled, (state, action) => {
        state.isLoading = false;
        state.user = action.payload;
        state.isAuthenticated = true;
        state.initialized = true;

        if (typeof window !== "undefined") {
          localStorage.setItem("user", JSON.stringify(action.payload));
        }
      })
      .addCase(fetchUserData.rejected, (state, action) => {
        state.isLoading = false;
        state.isAuthenticated = false;
        state.user = null;
        state.token = null;
        state.error = action.payload as string;

        if (typeof window !== "undefined") {
          localStorage.removeItem("token");
          localStorage.removeItem("user");
        }
      });
  },
});

export const {
  setCredentials,
  logout,
  setLoading,
  updateUser,
  setInitialized,
  clearError,
} = authSlice.actions;

export default authSlice.reducer;
