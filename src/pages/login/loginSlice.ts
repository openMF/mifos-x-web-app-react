/**
 * Copyright since 2025 Mifos Initiative
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */
import { createAsyncThunk, createSlice } from '@reduxjs/toolkit'
import { loginFineract } from '@/pages/login/loginApi'
import {
  captureTarget,
  clearAuthToken,
  clearOidcToken,
  hasSession,
  setBasicCredentials,
  setSignedInUser,
  type SignedInUser,
} from '@/lib/http-client'
import {
  clearPendingRenewal,
  getSignInRenewal,
  setPendingRenewal,
} from '@/lib/password-renewal'

interface AuthState {
  loading: boolean
  user: Record<string, unknown> | null
  error: string | null
  isAuthenticated: boolean
}

const initialState: AuthState = {
  loading: false,
  user: null,
  error: null,
  isAuthenticated: hasSession(),
}

/** Rejection value when Fineract wants a new password before sign-in. */
export const RENEW_PASSWORD = 'renewPassword'

export const loginUser = createAsyncThunk(
  'auth/login',
  async (
    { username, password }: { username: string; password: string },
    thunkAPI
  ) => {
    // Where this sign-in goes, read once: the renewal it may lead to must go
    // to the same server and tenant even if another tab changes them.
    const target = captureTarget()
    let data: Record<string, unknown>
    try {
      data = await loginFineract(username, password, target)
    } catch (err: unknown) {
      const renewal = getSignInRenewal(
        { error: err },
        username,
        password,
        target
      )
      if (renewal) {
        setPendingRenewal(renewal)
        return thunkAPI.rejectWithValue(RENEW_PASSWORD)
      }
      return thunkAPI.rejectWithValue('Login failed')
    }

    const renewal = getSignInRenewal({ data }, username, password, target)
    if (renewal) {
      setPendingRenewal(renewal)
      return thunkAPI.rejectWithValue(RENEW_PASSWORD)
    }

    clearPendingRenewal()
    setBasicCredentials(username, password)
    if (typeof data.userId === 'number') {
      setSignedInUser({
        userId: data.userId,
        username: String(data.username ?? username),
        officeName:
          typeof data.officeName === 'string' ? data.officeName : undefined,
        roles: Array.isArray(data.roles)
          ? (data.roles as SignedInUser['roles'])
          : undefined,
      })
    }
    // Password sign-in replaces any OIDC session: getAuthHeaders prefers the
    // OIDC token, so leaving it behind would keep calling Fineract as the
    // previously signed-in user.
    clearOidcToken()

    return data
  }
)

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    logout: state => {
      state.user = null
      state.isAuthenticated = false
      clearAuthToken()
      clearOidcToken()
      clearPendingRenewal()
    },
  },
  extraReducers: builder => {
    builder
      .addCase(loginUser.pending, state => {
        state.loading = true
        state.error = null
      })
      .addCase(loginUser.fulfilled, (state, action) => {
        state.loading = false
        state.user = action.payload
        state.isAuthenticated = true
      })
      .addCase(loginUser.rejected, (state, action) => {
        state.loading = false
        // Not a failure: the sign-in page moves on to the renewal page.
        state.error =
          action.payload === RENEW_PASSWORD ? null : (action.payload as string)
      })
  },
})

export const { logout } = authSlice.actions
export default authSlice.reducer
