/**
 * Copyright since 2025 Mifos Initiative
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */
import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { Plus } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'

import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import {
  faArrowDown,
  faArrowUp,
  faTrash,
} from '@fortawesome/free-solid-svg-icons'

import type { Survey, SurveyPayload } from './types'

/** Inputs are kept as strings until submit; uid only keys the React lists */
type ResponseRow = { uid: number; text: string; value: string }
type QuestionRow = {
  uid: number
  key: string
  text: string
  description: string
  responses: ResponseRow[]
}

let nextUid = 0
const uid = () => ++nextUid

const emptyResponse = (): ResponseRow => ({ uid: uid(), text: '', value: '' })
const emptyQuestion = (): QuestionRow => ({
  uid: uid(),
  key: '',
  text: '',
  description: '',
  responses: [emptyResponse()],
})

/** Swaps an item with its neighbour; out-of-range moves leave the list as is */
const move = <T,>(list: T[], index: number, offset: number) => {
  const target = index + offset
  if (target < 0 || target >= list.length) return list
  const next = [...list]
  ;[next[index], next[target]] = [next[target], next[index]]
  return next
}

// Same rules as the Angular form: two letters, and a whole number of up to four digits
const COUNTRY_CODE = /^[A-Za-z]{2}$/
const RESPONSE_VALUE = /^-?\d{1,4}$/

type SurveyFormProps = {
  title: string
  initial?: Survey
  cancelPath: string
  /** Sends the request; resolves to an error message, or null on success */
  onSubmit: (payload: SurveyPayload) => Promise<string | null>
}

/**
 * The Create and Edit Survey form of the Angular web app: a key, name,
 * country code and description, then the questions, each with the answer
 * options and the score (value) every option adds.
 */
const SurveyForm = ({
  title,
  initial,
  cancelPath,
  onSubmit,
}: SurveyFormProps) => {
  const navigate = useNavigate()
  const { t } = useTranslation(['organization', 'common'])
  const [key, setKey] = useState(initial?.key ?? '')
  const [name, setName] = useState(initial?.name ?? '')
  const [countryCode, setCountryCode] = useState(initial?.countryCode ?? '')
  const [description, setDescription] = useState(initial?.description ?? '')
  const [questions, setQuestions] = useState<QuestionRow[]>(() =>
    [...(initial?.questionDatas ?? [])]
      .sort((a, b) => (a.sequenceNo ?? 0) - (b.sequenceNo ?? 0))
      .map(q => ({
        uid: uid(),
        key: q.key ?? '',
        text: q.text ?? '',
        description: q.description ?? '',
        responses: [...(q.responseDatas ?? [])]
          .sort((a, b) => (a.sequenceNo ?? 0) - (b.sequenceNo ?? 0))
          .map(r => ({
            uid: uid(),
            text: r.text ?? '',
            value: r.value === undefined ? '' : String(r.value),
          })),
      }))
  )
  const [error, setError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)

  const updateQuestion = (qi: number, changes: Partial<QuestionRow>) => {
    setQuestions(prev =>
      prev.map((q, i) => (i === qi ? { ...q, ...changes } : q))
    )
    setError(null)
  }

  const updateResponse = (
    qi: number,
    ri: number,
    changes: Partial<ResponseRow>
  ) =>
    updateQuestion(qi, {
      responses: questions[qi].responses.map((r, i) =>
        i === ri ? { ...r, ...changes } : r
      ),
    })

  /** Returns the first problem with the form, or null when it can be sent */
  const formProblem = (): string | null => {
    if (!key.trim()) return t('surveys.validation.keyRequired')
    if (!name.trim()) return t('surveys.validation.nameRequired')
    if (!COUNTRY_CODE.test(countryCode.trim()))
      return t('surveys.validation.countryCode')
    // Fineract rejects a survey without questions
    if (questions.length === 0) return t('surveys.validation.questionRequired')
    for (const [i, q] of questions.entries()) {
      const number = i + 1
      if (!q.key.trim() || !q.text.trim())
        return t('surveys.validation.questionFields', { number })
      if (q.responses.length === 0)
        return t('surveys.validation.optionRequired', { number })
      if (q.responses.some(r => !r.text.trim()))
        return t('surveys.validation.optionText', { number })
      if (q.responses.some(r => !RESPONSE_VALUE.test(r.value.trim())))
        return t('surveys.validation.optionValue', { number })
    }
    return null
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (submitting) return
    const problem = formProblem()
    if (problem) return setError(problem)

    setSubmitting(true)
    setError(null)
    // The order on screen becomes the sequence numbers, starting at 1
    const message = await onSubmit({
      key: key.trim(),
      name: name.trim(),
      countryCode: countryCode.trim().toUpperCase(),
      description: description.trim(),
      questionDatas: questions.map((q, qi) => ({
        key: q.key.trim(),
        text: q.text.trim(),
        description: q.description.trim(),
        sequenceNo: qi + 1,
        responseDatas: q.responses.map((r, ri) => ({
          text: r.text.trim(),
          value: Number(r.value),
          sequenceNo: ri + 1,
        })),
      })),
    })
    // On success the page has already navigated away
    if (message) {
      setError(message)
      setSubmitting(false)
    }
  }

  return (
    <div className="bg-white dark:bg-zinc-900 rounded-md border p-8 shadow">
      <h2 className="text-2xl font-semibold mb-6">{title}</h2>

      <form className="space-y-6" onSubmit={handleSubmit}>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="space-y-2">
            <Label htmlFor="surveyKey">{t('surveys.fields.keyRequired')}</Label>
            <Input
              id="surveyKey"
              value={key}
              onChange={e => {
                setKey(e.target.value)
                setError(null)
              }}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="surveyName">
              {t('surveys.fields.nameRequired')}
            </Label>
            <Input
              id="surveyName"
              value={name}
              onChange={e => {
                setName(e.target.value)
                setError(null)
              }}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="surveyCountryCode">
              {t('surveys.fields.countryCodeRequired')}
            </Label>
            <Input
              id="surveyCountryCode"
              maxLength={2}
              placeholder={t('surveys.fields.countryCodeHint')}
              value={countryCode}
              onChange={e => {
                setCountryCode(e.target.value)
                setError(null)
              }}
            />
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="surveyDescription">
            {t('surveys.fields.description')}
          </Label>
          <Textarea
            id="surveyDescription"
            value={description}
            onChange={e => setDescription(e.target.value)}
          />
        </div>

        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold">
            {t('surveys.fields.questions')}
          </h3>
          <Button
            type="button"
            variant="outline"
            onClick={() => {
              setQuestions(prev => [...prev, emptyQuestion()])
              setError(null)
            }}
          >
            <Plus className="mr-1 h-4 w-4" /> {t('surveys.addQuestion')}
          </Button>
        </div>

        {questions.length === 0 && (
          <p className="text-sm text-muted-foreground">
            {t('surveys.noQuestions')}
          </p>
        )}

        {questions.map((q, qi) => {
          const number = qi + 1
          return (
            <fieldset
              key={q.uid}
              className="rounded-lg border p-4 space-y-4"
              aria-label={t('surveys.questionNumber', { number })}
            >
              <div className="flex items-center justify-between gap-2">
                <span className="font-medium">
                  {t('surveys.questionNumber', { number })}
                </span>
                <div className="flex gap-1">
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    disabled={qi === 0}
                    aria-label={t('surveys.moveQuestionUp', { number })}
                    onClick={() => setQuestions(prev => move(prev, qi, -1))}
                  >
                    <FontAwesomeIcon icon={faArrowUp} />
                  </Button>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    disabled={qi === questions.length - 1}
                    aria-label={t('surveys.moveQuestionDown', { number })}
                    onClick={() => setQuestions(prev => move(prev, qi, 1))}
                  >
                    <FontAwesomeIcon icon={faArrowDown} />
                  </Button>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="text-red-600"
                    aria-label={t('surveys.removeQuestion', { number })}
                    onClick={() =>
                      setQuestions(prev => prev.filter((_, i) => i !== qi))
                    }
                  >
                    <FontAwesomeIcon icon={faTrash} />
                  </Button>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-[1fr_2fr] gap-4">
                <div className="space-y-2">
                  <Label htmlFor={`question-${q.uid}-key`}>
                    {t('surveys.fields.keyRequired')}
                  </Label>
                  <Input
                    id={`question-${q.uid}-key`}
                    value={q.key}
                    onChange={e => updateQuestion(qi, { key: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor={`question-${q.uid}-text`}>
                    {t('surveys.fields.questionRequired')}
                  </Label>
                  <Input
                    id={`question-${q.uid}-text`}
                    value={q.text}
                    onChange={e => updateQuestion(qi, { text: e.target.value })}
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor={`question-${q.uid}-description`}>
                  {t('surveys.fields.description')}
                </Label>
                <Input
                  id={`question-${q.uid}-description`}
                  value={q.description}
                  onChange={e =>
                    updateQuestion(qi, { description: e.target.value })
                  }
                />
              </div>

              <div className="space-y-2">
                <div className="grid grid-cols-[1fr_120px_auto] gap-2 text-sm font-medium">
                  <span>{t('surveys.fields.optionRequired')}</span>
                  <span>{t('surveys.fields.valueRequired')}</span>
                  <span className="w-[104px]" />
                </div>
                {q.responses.map((r, ri) => {
                  const option = ri + 1
                  return (
                    <div
                      key={r.uid}
                      className="grid grid-cols-[1fr_120px_auto] gap-2 items-center"
                    >
                      <Input
                        aria-label={t('surveys.optionText', {
                          number,
                          option,
                        })}
                        value={r.text}
                        onChange={e =>
                          updateResponse(qi, ri, { text: e.target.value })
                        }
                      />
                      <Input
                        type="number"
                        step={1}
                        aria-label={t('surveys.optionValue', {
                          number,
                          option,
                        })}
                        value={r.value}
                        onChange={e =>
                          updateResponse(qi, ri, { value: e.target.value })
                        }
                      />
                      <div className="flex gap-1">
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          disabled={ri === 0}
                          aria-label={t('surveys.moveOptionUp', {
                            number,
                            option,
                          })}
                          onClick={() =>
                            updateQuestion(qi, {
                              responses: move(q.responses, ri, -1),
                            })
                          }
                        >
                          <FontAwesomeIcon icon={faArrowUp} />
                        </Button>
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          disabled={ri === q.responses.length - 1}
                          aria-label={t('surveys.moveOptionDown', {
                            number,
                            option,
                          })}
                          onClick={() =>
                            updateQuestion(qi, {
                              responses: move(q.responses, ri, 1),
                            })
                          }
                        >
                          <FontAwesomeIcon icon={faArrowDown} />
                        </Button>
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          className="text-red-600"
                          aria-label={t('surveys.removeOption', {
                            number,
                            option,
                          })}
                          onClick={() =>
                            updateQuestion(qi, {
                              responses: q.responses.filter((_, i) => i !== ri),
                            })
                          }
                        >
                          <FontAwesomeIcon icon={faTrash} />
                        </Button>
                      </div>
                    </div>
                  )
                })}
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() =>
                    updateQuestion(qi, {
                      responses: [...q.responses, emptyResponse()],
                    })
                  }
                >
                  <Plus className="mr-1 h-4 w-4" /> {t('surveys.addOption')}
                </Button>
              </div>
            </fieldset>
          )
        })}

        {error && (
          <div className="rounded-md border border-red-300 bg-red-50 px-4 py-2 text-sm text-red-700 dark:border-red-700 dark:bg-red-950 dark:text-red-300">
            {error}
          </div>
        )}

        <div className="flex justify-end gap-3">
          <Button
            type="button"
            variant="outline"
            onClick={() => navigate(cancelPath)}
          >
            {t('common:actions.cancel')}
          </Button>
          <Button
            type="submit"
            className="bg-[#1074b9] hover:bg-[#1074c9] text-white"
            disabled={submitting}
          >
            {t('common:actions.submit')}
          </Button>
        </div>
      </form>
    </div>
  )
}

export default SurveyForm
