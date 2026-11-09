/**
 * Copyright since 2025 Mifos Initiative
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */
import { describe, expect, it } from 'vitest'
import { AxiosError, AxiosHeaders } from 'axios'
import { extractErrorMessage } from '../document-utils'

const createAxiosError = (status: number, data: unknown): AxiosError => {
  const error = new AxiosError(
    `Request failed with status code ${status}`,
    `${status}`,
    undefined,
    undefined,
    {
      status,
      statusText: 'Error',
      headers: {},
      config: { headers: new AxiosHeaders() },
      data,
    }
  )
  return error
}

describe('extractErrorMessage', () => {
  const fallback = 'Failed to upload document. Please try again.'

  it('extracts defaultUserMessage from response object', () => {
    const error = createAxiosError(400, {
      defaultUserMessage: 'Document with this name already exists.',
    })
    expect(extractErrorMessage(error, fallback)).toBe(
      'Document with this name already exists.'
    )
  })

  it('extracts defaultUserMessage from errors array', () => {
    const error = createAxiosError(400, {
      errors: [
        {
          defaultUserMessage: 'The parameter `file` cannot be empty.',
        },
      ],
    })
    expect(extractErrorMessage(error, fallback)).toBe(
      'The parameter `file` cannot be empty.'
    )
  })

  it('prioritizes errors[0].defaultUserMessage over response-level defaultUserMessage', () => {
    const error = createAxiosError(400, {
      defaultUserMessage: 'Validation errors exist.',
      errors: [
        {
          defaultUserMessage: 'The parameter `description` cannot be empty.',
        },
      ],
    })
    expect(extractErrorMessage(error, fallback)).toBe(
      'The parameter `description` cannot be empty.'
    )
  })

  it('extracts message property from response object if defaultUserMessage is absent', () => {
    const error = createAxiosError(400, {
      message: 'Invalid input payload.',
    })
    expect(extractErrorMessage(error, fallback)).toBe('Invalid input payload.')
  })

  it('extracts string response data directly', () => {
    const error = createAxiosError(500, 'Internal Server Error occurred')
    expect(extractErrorMessage(error, fallback)).toBe(
      'Internal Server Error occurred'
    )
  })

  it('falls back to Axios error message if data contains no readable text', () => {
    const error = createAxiosError(415, {})
    expect(extractErrorMessage(error, fallback)).toBe(
      'Request failed with status code 415'
    )
  })

  it('extracts message from standard JavaScript Error instance', () => {
    const error = new Error('Network timeout during upload')
    expect(extractErrorMessage(error, fallback)).toBe(
      'Network timeout during upload'
    )
  })

  it('returns fallback message for unknown or null errors', () => {
    expect(extractErrorMessage(null, fallback)).toBe(fallback)
    expect(extractErrorMessage(undefined, fallback)).toBe(fallback)
    expect(extractErrorMessage({}, fallback)).toBe(fallback)
  })
})
