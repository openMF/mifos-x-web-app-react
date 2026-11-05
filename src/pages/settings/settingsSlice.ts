/**
 * Copyright since 2025 Mifos Initiative
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */
import { createSlice, type PayloadAction } from '@reduxjs/toolkit'

const STORAGE_KEY = 'mifos-decimals-to-display'
const DEFAULT_DECIMAL_PLACES = 2

function readDecimalPlaces(): number {
  if (typeof window === 'undefined') return DEFAULT_DECIMAL_PLACES

  try {
    const stored = window.localStorage.getItem(STORAGE_KEY)
    if (stored === null) return DEFAULT_DECIMAL_PLACES
    if (!/^[0-8]$/.test(stored)) return DEFAULT_DECIMAL_PLACES
    const value = Number(stored)
    return Number.isInteger(value) && value >= 0 && value <= 8
      ? value
      : DEFAULT_DECIMAL_PLACES
  } catch (error) {
    console.warn('Could not load decimal display preference', error)
    return DEFAULT_DECIMAL_PLACES
  }
}

export function persistDecimalPlaces(value: number): void {
  if (typeof window === 'undefined') {
    console.error('Could not save decimal display preference outside a browser')
    return
  }

  try {
    window.localStorage.setItem(STORAGE_KEY, String(value))
  } catch (error) {
    console.error('Could not save decimal display preference', error)
  }
}

const settingsSlice = createSlice({
  name: 'settings',
  initialState: { decimalPlaces: readDecimalPlaces() },
  reducers: {
    setDecimalPlaces(state, action: PayloadAction<number>) {
      state.decimalPlaces = action.payload
    },
  },
})

export const { setDecimalPlaces } = settingsSlice.actions
export default settingsSlice.reducer
