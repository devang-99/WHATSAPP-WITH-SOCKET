/* eslint-disable @typescript-eslint/no-explicit-any */
import { createSlice, createAsyncThunk, PayloadAction } from "@reduxjs/toolkit";
import {
  createUser,
  findUser,
  getCurrentUserApi,
  getUsers,
  SocialSignIn,
  toggleBanUser,
  updateProfileApi,
} from "./authService";

export type User = {
  userid?: string;
  email: string | null;
  username?: string | null;
  isBanned?: boolean;
  role?: string;
  photoURL?: string | null;
  isOnline?: boolean;
  bio?: string;
  profilePic?: string;
};

// interface User {
//   useremail: string;
//   userpassword?: string;
//   username: string;
//   userid: number;
//   role?: string;
//   isBanned?: boolean;
// }

export type AuthState = {
  users: User[];
  total: number;
  page: number;
  limit: number;
  currentUser: User | null;
  loading: boolean;
  error: string | null;
};

const initialState: AuthState = {
  users: [],
  total: 0,
  page: 1,
  limit: 5,
  currentUser: null,
  loading: false,
  error: null,
};

export const registerUser = createAsyncThunk(
  "user/register",

  async (credentials: any, { rejectWithValue }) => {
    console.log(credentials, "credentials in register");
    try {
      return await createUser(credentials);
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || error.message);
    }
  },
);

export const loginUser = createAsyncThunk(
  "user/login",
  async (credentials: any, { rejectWithValue }) => {
    console.log(credentials, "credentials in login");
    try {
      return await findUser(credentials);
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || error.message);
    }
  },
);

export const socialLogin = createAsyncThunk(
  "user/loginGoogle",

  async (credentials: any, { rejectWithValue }) => {
    console.log(credentials, "credentials in login google");
    try {
      return await SocialSignIn(credentials);
    } catch (error: any) {
      console.log(error, "hsfhg");
      return rejectWithValue(error.response?.data?.message || error.message);
    }
  },
);

export const fetchUsers = createAsyncThunk(
  "auth/fetchUsers",
  async (
    { page, limit }: { page: number; limit: number },
    { rejectWithValue },
  ) => {
    try {
      return await getUsers({ page, limit });
    } catch (err: any) {
      return rejectWithValue(err.message);
    }
  },
);

export const toggleUserBan = createAsyncThunk(
  "user/toggleBan",
  async (userid: number, { rejectWithValue }) => {
    try {
      return await toggleBanUser(userid);
    } catch (error: any) {
      return rejectWithValue(error.message);
    }
  },
);

export const updateProfile = createAsyncThunk(
  "user/updateProfile",
  async (
    { userid, formData }: { userid: string; formData: FormData },
    { rejectWithValue },
  ) => {
    try {
      return await updateProfileApi(userid, formData);
    } catch (err: any) {
      return rejectWithValue(err.message);
    }
  },
);

export const fetchCurrentUser = createAsyncThunk(
  "auth/fetchCurrentUser",
  async (userid: string, { rejectWithValue }) => {
    try {
      return await getCurrentUserApi(userid);
    } catch (err: any) {
      return rejectWithValue(err.message);
    }
  },
);

const authenticateSlice = createSlice({
  name: "authenticate",
  initialState,
  reducers: {
    logout: (state) => {
      state.currentUser = null;
    },
    addCurrentUser: (state, action: PayloadAction<User>) => {
      state.currentUser = action.payload;
    },
  },
  extraReducers: (builder) => {
    builder

      .addCase(registerUser.pending, (state) => {
        console.log("register pending");
        state.loading = true;
        state.error = null;
      })
      .addCase(registerUser.fulfilled, (state, action) => {
        console.log("register fulfilled", action.payload);
        state.loading = false;
        state.currentUser = action.payload;
        console.log("currentUser after creatinguser", state.currentUser);
      })
      .addCase(registerUser.rejected, (state, action) => {
        console.log("register rejected");
        console.log("register error", state.error);
        state.loading = false;
        state.error = action.payload as string;
        state.currentUser = null;
      })
      .addCase(loginUser.pending, (state) => {
        console.log("login pending");
        state.loading = true;
        state.error = null;
      })
      .addCase(loginUser.fulfilled, (state, action) => {
        console.log("login fulfilled", action.payload);
        state.loading = false;
        state.currentUser = action.payload;
      })
      .addCase(loginUser.rejected, (state, action) => {
        console.log("login rejected");
        console.log("login error", state.error);
        state.loading = false;
        state.error = action.payload as string;
        state.currentUser = null;
      })
      .addCase(socialLogin.pending, (state) => {
        console.log("login pending");
        state.loading = true;
        state.error = null;
      })
      .addCase(socialLogin.fulfilled, (state, action) => {
        console.log("login fulfilled", action.payload);
        state.loading = false;
        state.currentUser = action.payload;
      })
      .addCase(socialLogin.rejected, (state) => {
        console.log("login rejected");
        console.log("login google error", state.error);
        state.loading = false;
        state.error = "User Banned Contact Admin";
        state.currentUser = null;
        console.log("login google error", state.error);
      })
      .addCase(fetchUsers.pending, (state) => {
        state.loading = true;
      })
      .addCase(fetchUsers.fulfilled, (state, action) => {
        // console.log(action.payload.data);
        state.loading = false;
        state.users = action.payload.data;
        state.total = action.payload.total;
      })
      .addCase(fetchUsers.rejected, (state) => {
        state.loading = false;
      })
      .addCase(toggleUserBan.fulfilled, (state, action) => {
        console.log(action.payload);
        const updatedUser = action.payload;

        const index = state.users.findIndex(
          (u) => u.userid === updatedUser.userid,
        );

        if (index !== -1) {
          state.users[index].isBanned = updatedUser.isBanned;
        }
      })
      .addCase(updateProfile.fulfilled, (state, action) => {
        state.currentUser = action.payload;
      })
      .addCase(fetchCurrentUser.fulfilled, (state, action) => {
        state.currentUser = action.payload;
      });
  },
});

export const { addCurrentUser, logout } = authenticateSlice.actions;
export default authenticateSlice.reducer;
