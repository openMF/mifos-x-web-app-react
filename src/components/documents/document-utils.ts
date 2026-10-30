/**
 * Copyright since 2025 Mifos Initiative
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */
import { isAxiosError } from 'axios'

/**
 * Safely extracts a readable error message from Fineract API errors or network errors.
 */
export const extractErrorMessage = (err: unknown, fallback: string): string => {
  if (isAxiosError(err)) {
    const data = err.response?.data
    if (data && typeof data === 'object') {
      const obj = data as Record<string, unknown>
      if (
        Array.isArray(obj.errors) &&
        obj.errors.length > 0 &&
        typeof obj.errors[0] === 'object' &&
        obj.errors[0] !== null
      ) {
        const firstErr = obj.errors[0] as Record<string, unknown>
        if (
          typeof firstErr.defaultUserMessage === 'string' &&
          firstErr.defaultUserMessage.trim()
        ) {
          return firstErr.defaultUserMessage
        }
        if (
          typeof firstErr.developerMessage === 'string' &&
          firstErr.developerMessage.trim()
        ) {
          return firstErr.developerMessage
        }
      }
      if (
        typeof obj.defaultUserMessage === 'string' &&
        obj.defaultUserMessage.trim()
      ) {
        return obj.defaultUserMessage
      }
      if (
        typeof obj.developerMessage === 'string' &&
        obj.developerMessage.trim()
      ) {
        return obj.developerMessage
      }
      if (typeof obj.message === 'string' && obj.message.trim()) {
        return obj.message
      }
      if (typeof obj.error === 'string' && obj.error.trim()) {
        return obj.error
      }
      if (typeof obj.exception === 'string' && obj.exception.trim()) {
        return obj.exception
      }
    } else if (typeof data === 'string' && data.trim()) {
      return data
    }
    if (typeof err.message === 'string' && err.message.trim()) {
      return err.message
    }
  } else if (err instanceof Error && err.message.trim()) {
    return err.message
  }
  return fallback
}
