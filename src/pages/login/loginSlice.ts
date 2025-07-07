import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import { loginFineract } from "@/pages/login/loginApi";

interface AuthState {
    loading: boolean,
    user: any,
    error: string|null,
    isAuthenticated: boolean
}

const initialState: AuthState = {
    loading: false,
    user: null,
    error: null,
    isAuthenticated: localStorage.getItem("mifosToken") ? true : false
};

export const loginUser = createAsyncThunk(
    "auth/login",
    async (
        { username, password }: { username: string; password: string },
        thunkAPI
    ) => {
        try {
            const data = await loginFineract(username, password);
            const encoded = btoa(`${username}:${password}`);
            localStorage.setItem("mifosToken", encoded);

            return data;
        } catch (err: any) {
            return thunkAPI.rejectWithValue("Login failed");
        }
    }
);

const authSlice = createSlice({
    name: "auth",
    initialState,
    reducers: {
        logout: (state) => {
            state.user = null;
            state.isAuthenticated = false;
            localStorage.removeItem("mifosToken");
        },
    },
    extraReducers: (builder) => {
        builder
            .addCase(loginUser.pending, (state) => {
                state.loading = true;
                state.error = null;
            })
            .addCase(loginUser.fulfilled, (state, action) => {
                state.loading = false;
                state.user = action.payload;
                state.isAuthenticated = true;
            })
            .addCase(loginUser.rejected, (state, action) => {
                state.loading = false;
                state.error = action.payload as string;
            });
    },
});

export const { logout } = authSlice.actions;
export default authSlice.reducer;
