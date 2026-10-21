/**
 * Copyright since 2025 Mifos Initiative
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */
import { configureStore } from '@reduxjs/toolkit'
import authReducer from '@/pages/login/loginSlice'
import settingsReducer from '@/pages/settings/settingsSlice'

export const store = configureStore({
  reducer: {
    auth: authReducer,
    settings: settingsReducer,
  },
})

export type RootState = ReturnType<typeof store.getState>
export type AppDispatch = typeof store.dispatch
