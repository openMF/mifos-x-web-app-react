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
  clearAuthToken,
  clearOidcToken,
  clearTwoFactorState,
  getAuthToken,
  getTenantId,
  hasSession,
  setBasicToken,
  setTwoFactorToken,
} from '@/lib/http-client'
import {
  clearPendingVerification,
  requiresTwoFactor,
  setPendingVerification,
  type PendingVerification,
  type TwoFactorAccessToken,
} from '@/lib/two-factor'

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

/** Rejection value when Fineract wants a one-time code before sign-in. */
export const TWO_FACTOR = 'twoFactor'

/**
 * Stores what a finished password sign-in needs. It replaces whatever the
 * browser held before, two-factor state included, so a token of a previous
 * user is never sent with this user's password.
 */
const storePasswordSession = (authKey: string) => {
  clearPendingVerification()
  clearTwoFactorState()
  setBasicToken(authKey)
  // Password sign-in replaces any OIDC session: getAuthHeaders prefers the
  // OIDC token, so leaving it behind would keep calling Fineract as the
  // previously signed-in user.
  clearOidcToken()
}

export const loginUser = createAsyncThunk(
  'auth/login',
  async (
    {
      username,
      password,
      rememberMe = false,
    }: { username: string; password: string; rememberMe?: boolean },
    thunkAPI
  ) => {
    let data: Record<string, unknown>
    try {
      data = await loginFineract(username, password)
    } catch (_err: unknown) {
      // Reserved for future use
      return thunkAPI.rejectWithValue('Login failed')
    }

    const authKey = btoa(`${username}:${password}`)

    // The password is right, but nothing opens until a one-time code is
    // entered. Nothing is stored yet: the code page finishes the sign-in.
    if (requiresTwoFactor(data)) {
      setPendingVerification({
        username,
        authKey,
        tenant: getTenantId(),
        rememberMe,
        reason: 'signIn',
        user: data,
      })
      return thunkAPI.rejectWithValue(TWO_FACTOR)
    }

    storePasswordSession(authKey)
    return data
  }
)

/** Rejection value when the browser moved to another credential meanwhile. */
export const SESSION_CHANGED = 'sessionChanged'

/**
 * Finishes a sign-in, or resumes a session, with the access token Fineract
 * gave for a valid one-time code.
 */
export const completeTwoFactor = createAsyncThunk(
  'auth/completeTwoFactor',
  async (
    {
      verification,
      accessToken,
    }: {
      verification: PendingVerification
      accessToken: TwoFactorAccessToken
    },
    thunkAPI
  ) => {
    if (verification.reason === 'signIn') {
      storePasswordSession(verification.authKey)
    } else if (getAuthToken() !== verification.authKey) {
      // Signed out, or signed in as someone else in another tab, while the
      // code was entered: the token would belong to the wrong credential.
      clearPendingVerification()
      return thunkAPI.rejectWithValue(SESSION_CHANGED)
    }

    clearPendingVerification()
    setTwoFactorToken(
      accessToken.token,
      accessToken.validTo,
      verification.rememberMe
    )
    return verification.user ?? null
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
      clearPendingVerification()
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
        // Not a failure: the sign-in page moves on to the code page.
        state.error =
          action.payload === TWO_FACTOR ? null : (action.payload as string)
      })
      .addCase(completeTwoFactor.fulfilled, (state, action) => {
        state.isAuthenticated = true
        if (action.payload) state.user = action.payload
      })
  },
})

export const { logout } = authSlice.actions
export default authSlice.reducer
