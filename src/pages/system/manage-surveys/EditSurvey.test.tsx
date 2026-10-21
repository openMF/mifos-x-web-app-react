/**
 * Copyright since 2025 Mifos Initiative
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

import { act, fireEvent, render, screen } from '@testing-library/react'
import i18next from 'i18next'
import { Link, MemoryRouter, Route, Routes } from 'react-router-dom'
import { beforeAll, expect, it, vi } from 'vitest'

import organization from '@/locales/en-US/organization.json'
import EditSurvey from './EditSurvey'
import type { Survey } from './types'

const { findSurvey, editSurvey } = vi.hoisted(() => ({
  findSurvey: vi.fn(),
  editSurvey: vi.fn(),
}))

vi.mock('@/fineract-api', () => ({
  SpmSurveysApi: class {
    findSurvey = findSurvey
    editSurvey = editSurvey
  },
}))

vi.mock('@/lib/fineract-openapi', () => ({ getConfiguration: () => ({}) }))

beforeAll(() => {
  i18next.addResourceBundle('en-US', 'organization', organization)
})

it('loads the new survey before allowing edits for its ID', async () => {
  type SurveyResponse = { data: Survey }
  let resolveSecondSurvey!: (response: SurveyResponse) => void
  const secondSurvey = new Promise<SurveyResponse>(resolve => {
    resolveSecondSurvey = resolve
  })
  findSurvey.mockResolvedValueOnce({ data: { id: 1, name: 'First survey' } })
  findSurvey.mockReturnValueOnce(secondSurvey)
  editSurvey.mockResolvedValueOnce({})

  render(
    <MemoryRouter initialEntries={['/system/surveys/1/edit']}>
      <Link to="/system/surveys/2/edit">Switch survey</Link>
      <Routes>
        <Route path="/system/surveys/:id/edit" element={<EditSurvey />} />
        <Route path="/system/surveys/2" element={<h1>Saved</h1>} />
      </Routes>
    </MemoryRouter>
  )

  expect(await screen.findByDisplayValue('First survey')).toBeTruthy()
  fireEvent.click(screen.getByRole('link', { name: 'Switch survey' }))
  expect(screen.queryByDisplayValue('First survey')).toBeNull()
  expect(screen.queryByRole('button', { name: 'Submit' })).toBeNull()
  expect(screen.getByRole('status').textContent).toBe('Loading...')

  await act(async () => {
    resolveSecondSurvey({
      data: {
        id: 2,
        key: 'second',
        name: 'Second survey',
        countryCode: 'IN',
        questionDatas: [
          {
            key: 'q1',
            text: 'How was your visit?',
            responseDatas: [{ text: 'Good', value: 1 }],
          },
        ],
      },
    })
  })

  expect(screen.getByDisplayValue('Second survey')).toBeTruthy()
  fireEvent.click(screen.getByRole('button', { name: 'Submit' }))
  expect(editSurvey).toHaveBeenCalledWith(
    2,
    expect.objectContaining({ key: 'second', name: 'Second survey' })
  )
  expect(await screen.findByRole('heading', { name: 'Saved' })).toBeTruthy()
})
