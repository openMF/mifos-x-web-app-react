/**
 * Copyright since 2025 Mifos Initiative
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */
import { useMemo, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'

import AppSelect from '@/components/custom/select/AppSelect'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import fineract from '@/lib/axios'

import BusinessRuleParameters, {
  type ParamValue,
} from './BusinessRuleParameters'
import {
  apiErrorMessage,
  isNotification as campaignIsNotification,
  MAX_CAMPAIGN_NAME,
  MAX_MESSAGE,
  nowInputValue,
  recurrenceStartInputValue,
  TRIGGER_SCHEDULE,
  TRIGGER_TRIGGERED,
  type SmsCampaign,
  type SmsCampaignTemplate,
} from './types'

/** What the form hands to the create or edit page */
export type CampaignFormValue = {
  campaignName: string
  isNotification: boolean
  providerId?: number
  triggerType: number
  runReportId: number
  paramValue: ParamValue
  message: string
  /** yyyy-MM-ddTHH:mm, scheduled campaigns only */
  recurrenceStartDate?: string
  frequency?: number
  interval?: string
  repeatsOnDay?: string
}

type Props = {
  template: SmsCampaignTemplate
  /** Edit mode: the campaign details are fixed and only the message changes */
  campaign?: SmsCampaign
  cancelPath: string
  onSubmit: (value: CampaignFormValue) => Promise<string | null>
}

const INTERVALS: Record<number, string[]> = {
  1: ['1', '2', '3'],
  2: ['1', '2', '3'],
  3: ['1', '2', '3', '4', '5', '6', '7', '8', '9', '10', '11'],
  4: ['1', '2', '3', '4', '5'],
}
const WEEKDAYS = [
  'monday',
  'tuesday',
  'wednesday',
  'thursday',
  'friday',
  'saturday',
  'sunday',
] as const

/**
 * The SMS campaign stepper of the Angular web app: campaign details and
 * business rule parameters, then the message, then a review to submit.
 */
const CampaignForm = ({ template, campaign, cancelPath, onSubmit }: Props) => {
  const { t } = useTranslation(['organization', 'common'])
  const navigate = useNavigate()
  const editing = campaign !== undefined
  const messageRef = useRef<HTMLTextAreaElement>(null)

  const [step, setStep] = useState(0)
  const [campaignName, setCampaignName] = useState(campaign?.campaignName ?? '')
  const [notification, setNotification] = useState(
    campaignIsNotification(campaign)
  )
  const [providerId, setProviderId] = useState(
    campaign?.providerId ? String(campaign.providerId) : ''
  )
  const [triggerType, setTriggerType] = useState(
    campaign?.triggerType?.id ? String(campaign.triggerType.id) : ''
  )
  const [runReportId, setRunReportId] = useState(
    campaign?.runReportId ? String(campaign.runReportId) : ''
  )
  const [recurrenceStartDate, setRecurrenceStartDate] = useState(() =>
    recurrenceStartInputValue(campaign?.recurrenceStartDate)
  )
  const [frequency, setFrequency] = useState('')
  const [interval, setRepeatInterval] = useState('')
  const [repeatsOnDay, setRepeatsOnDay] = useState('')
  const [paramValue, setParamValue] = useState<ParamValue | null>(null)
  const [columns, setColumns] = useState<string[] | null>(null)
  const [message, setMessage] = useState(campaign?.campaignMessage ?? '')
  const [preview, setPreview] = useState<{
    text: string
    count?: number
  } | null>(null)
  const [previewing, setPreviewing] = useState(false)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const trigger = Number(triggerType)
  const scheduled = trigger === TRIGGER_SCHEDULE
  const weekly = scheduled && frequency === '2'

  // Triggered campaigns use "Triggered" reports, the others every other report
  const businessRules = useMemo(
    () =>
      (template.businessRulesOptions ?? []).filter(r =>
        trigger === TRIGGER_TRIGGERED
          ? r.reportSubType === 'Triggered'
          : r.reportSubType !== 'Triggered'
      ),
    [template.businessRulesOptions, trigger]
  )
  const report = (template.businessRulesOptions ?? []).find(
    r => String(r.reportId) === runReportId
  )
  const reportName = editing ? campaign?.reportName : report?.reportName
  const saved = useMemo(() => {
    if (!editing) return undefined
    try {
      return JSON.parse(campaign?.paramValue ?? '{}') as Record<string, string>
    } catch {
      return {}
    }
  }, [editing, campaign?.paramValue])

  const startInFuture = recurrenceStartDate > nowInputValue()
  const detailsValid =
    campaignName.trim() !== '' &&
    triggerType !== '' &&
    runReportId !== '' &&
    paramValue !== null &&
    (!scheduled ||
      (recurrenceStartDate !== '' &&
        // Fineract refuses a start in the past on create, not on update
        (editing || startInFuture) &&
        (editing ||
          (frequency !== '' &&
            interval !== '' &&
            (!weekly || repeatsOnDay !== '')))))
  const messageValid = message.trim() !== ''

  const value = (): CampaignFormValue => ({
    campaignName: campaignName.trim(),
    isNotification: notification,
    providerId: !notification && providerId ? Number(providerId) : undefined,
    triggerType: trigger,
    runReportId: Number(runReportId),
    paramValue: paramValue as ParamValue,
    message,
    ...(scheduled ? { recurrenceStartDate } : {}),
    ...(scheduled && !editing
      ? {
          frequency: Number(frequency),
          interval,
          ...(weekly ? { repeatsOnDay } : {}),
        }
      : {}),
  })

  const insertPlaceholder = (column: string) => {
    const text = ` {{${column}}} `
    const el = messageRef.current
    if (!el) {
      setMessage(prev => prev + text)
      return
    }
    // Insert at the cursor, as a user would expect, and keep the focus there
    const start = el.selectionStart ?? message.length
    const end = el.selectionEnd ?? message.length
    const next = message.slice(0, start) + text + message.slice(end)
    setMessage(next)
    requestAnimationFrame(() => {
      el.focus()
      el.setSelectionRange(start + text.length, start + text.length)
    })
    setPreview(null)
  }

  // Fineract fills the placeholders with the first matching record
  const runPreview = async () => {
    if (!paramValue || !messageValid || previewing) return
    setPreviewing(true)
    setError(null)
    try {
      const res = await fineract.post<{
        campaignMessage?: string
        totalNumberOfMessages?: number
      }>('v1/smscampaigns/preview', { message, paramValue })
      setPreview({
        text: res.data?.campaignMessage ?? '',
        count: res.data?.totalNumberOfMessages,
      })
    } catch (err) {
      setPreview(null)
      setError(apiErrorMessage(err, t('smsCampaign.errors.preview')))
    } finally {
      setPreviewing(false)
    }
  }

  const submit = async () => {
    if (!detailsValid || !messageValid || saving) return
    setSaving(true)
    setError(null)
    const failure = await onSubmit(value())
    if (failure) {
      setError(failure)
      setSaving(false)
    }
  }

  const providers = (template.smsProviderOptions ?? []).map(p => ({
    id: p.id ?? 0,
    name: p.providerName ?? String(p.id),
  }))
  const providerName =
    providers.find(p => String(p.id) === providerId)?.name ??
    // No provider list when the edit page could not load the template
    (providerId || t('smsCampaign.unassigned'))
  const triggerName =
    (template.triggerTypeOptions ?? []).find(o => String(o.id) === triggerType)
      ?.value ??
    campaign?.triggerType?.value ??
    '—'

  const steps = [
    t('smsCampaign.steps.campaign'),
    t('smsCampaign.steps.message'),
    t('smsCampaign.steps.preview'),
  ]

  return (
    <div className="bg-white dark:bg-zinc-800 rounded-lg border border-zinc-200 dark:border-zinc-700 shadow-sm p-6 space-y-6">
      <ol className="flex flex-wrap gap-4">
        {steps.map((label, i) => (
          <li
            key={label}
            aria-current={i === step ? 'step' : undefined}
            className={`flex items-center gap-2 text-sm font-medium ${
              i === step ? 'text-[#1074b9]' : 'text-zinc-500'
            }`}
          >
            <span
              className={`flex h-7 w-7 items-center justify-center rounded-full border-2 ${
                i === step
                  ? 'border-[#1074b9] bg-[#1074b9] text-white'
                  : 'border-zinc-400'
              }`}
            >
              {i + 1}
            </span>
            {label}
          </li>
        ))}
      </ol>

      {/* Kept mounted while hidden, so going back keeps the parameters */}
      <div className={step === 0 ? 'space-y-6' : 'hidden'}>
        <div className="flex flex-wrap gap-4">
          <div className="w-full md:w-[48%] space-y-2">
            <Label htmlFor="campaignName">
              {t('smsCampaign.fields.campaignName')} *
            </Label>
            <Input
              id="campaignName"
              value={campaignName}
              maxLength={MAX_CAMPAIGN_NAME}
              disabled={editing}
              onChange={e => setCampaignName(e.target.value)}
            />
          </div>
          {!notification &&
            (editing ? (
              <div className="w-full md:w-[48%] space-y-2">
                <Label>{t('smsCampaign.fields.smsProvider')}</Label>
                <Input value={providerName} disabled />
              </div>
            ) : (
              <AppSelect
                selectLabel={t('smsCampaign.fields.smsProvider')}
                selectPlaceholder={t('smsCampaign.placeholders.smsProvider')}
                selectValue={providerId}
                selectOnChange={setProviderId}
                selectOptions={providers}
                selectEmptyMessage={t('smsCampaign.noProviders')}
              />
            ))}
          {editing ? (
            <div className="w-full md:w-[48%] space-y-2">
              <Label>{t('smsCampaign.fields.triggerType')}</Label>
              <Input value={triggerName} disabled />
            </div>
          ) : (
            <AppSelect
              selectLabel={`${t('smsCampaign.fields.triggerType')} *`}
              selectPlaceholder={t('smsCampaign.placeholders.triggerType')}
              selectValue={triggerType}
              selectOnChange={v => {
                setTriggerType(v)
                // The business rules depend on the trigger type
                setRunReportId('')
                setParamValue(null)
                setColumns(null)
              }}
              selectOptions={(template.triggerTypeOptions ?? []).map(o => ({
                id: o.id ?? 0,
                name: o.value ?? '',
              }))}
            />
          )}
          <div className="w-full md:w-[48%] flex items-center gap-2 pt-6">
            <Checkbox
              id="isNotification"
              checked={notification}
              disabled={editing}
              onCheckedChange={v => setNotification(v === true)}
            />
            <Label htmlFor="isNotification">
              {t('smsCampaign.fields.isNotification')}
            </Label>
          </div>
          {scheduled && (
            <div className="w-full md:w-[48%] space-y-2">
              <Label htmlFor="recurrenceStartDate">
                {t('smsCampaign.fields.scheduleDate')} *
              </Label>
              <Input
                id="recurrenceStartDate"
                type="datetime-local"
                min={editing ? undefined : nowInputValue()}
                value={recurrenceStartDate}
                onChange={e => setRecurrenceStartDate(e.target.value)}
              />
              {editing ? (
                <p className="text-xs text-muted-foreground">
                  {t('smsCampaign.hints.checkStart')}
                </p>
              ) : (
                recurrenceStartDate !== '' &&
                !startInFuture && (
                  <p className="text-xs text-red-600 dark:text-red-400">
                    {t('smsCampaign.hints.startInPast')}
                  </p>
                )
              )}
            </div>
          )}
          {scheduled && !editing && (
            <>
              <AppSelect
                selectLabel={`${t('smsCampaign.fields.repeats')} *`}
                selectPlaceholder={t('smsCampaign.fields.repeats')}
                selectValue={frequency}
                selectOnChange={v => {
                  setFrequency(v)
                  setRepeatInterval('')
                  setRepeatsOnDay('')
                }}
                selectOptions={[
                  { id: 1, name: t('smsCampaign.frequency.daily') },
                  { id: 2, name: t('smsCampaign.frequency.weekly') },
                  { id: 3, name: t('smsCampaign.frequency.monthly') },
                  { id: 4, name: t('smsCampaign.frequency.yearly') },
                ]}
              />
              {frequency && (
                <AppSelect
                  selectLabel={`${t('smsCampaign.fields.repetitionInterval')} *`}
                  selectPlaceholder={t('smsCampaign.fields.repetitionInterval')}
                  selectValue={interval}
                  selectOnChange={setRepeatInterval}
                  selectOptions={(INTERVALS[Number(frequency)] ?? []).map(
                    i => ({
                      id: i,
                      name: i,
                    })
                  )}
                />
              )}
              {weekly && (
                <AppSelect
                  selectLabel={`${t('smsCampaign.fields.repeatsOnDay')} *`}
                  selectPlaceholder={t('smsCampaign.fields.repeatsOnDay')}
                  selectValue={repeatsOnDay}
                  selectOnChange={setRepeatsOnDay}
                  selectOptions={WEEKDAYS.map((d, i) => ({
                    id: String(i + 1),
                    name: t(`smsCampaign.weekdays.${d}`),
                  }))}
                />
              )}
            </>
          )}
          {editing && campaign?.recurrence && (
            <div className="w-full md:w-[48%] space-y-2">
              <Label>{t('smsCampaign.fields.recurrence')}</Label>
              <Input value={campaign.recurrence} disabled />
            </div>
          )}
          {editing ? (
            <div className="w-full md:w-[48%] space-y-2">
              <Label>{t('smsCampaign.fields.businessRule')}</Label>
              <Input value={campaign?.reportName ?? ''} disabled />
            </div>
          ) : (
            <AppSelect
              selectLabel={`${t('smsCampaign.fields.businessRule')} *`}
              selectPlaceholder={
                triggerType
                  ? t('smsCampaign.placeholders.businessRule')
                  : t('smsCampaign.placeholders.triggerFirst')
              }
              selectValue={runReportId}
              selectOnChange={v => {
                setRunReportId(v)
                setParamValue(null)
                setColumns(null)
              }}
              selectOptions={
                triggerType
                  ? businessRules.map(r => ({
                      id: r.reportId ?? 0,
                      name: r.reportName ?? '',
                    }))
                  : []
              }
              selectEmptyMessage={t('smsCampaign.noBusinessRules')}
            />
          )}
        </div>

        {reportName && (
          <BusinessRuleParameters
            key={reportName}
            reportName={reportName}
            saved={saved}
            onChange={setParamValue}
            onColumns={setColumns}
          />
        )}
      </div>

      {step === 1 && (
        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="campaignMessage">
              {t('smsCampaign.fields.campaignMessage')} *
            </Label>
            <Textarea
              id="campaignMessage"
              ref={messageRef}
              rows={5}
              maxLength={MAX_MESSAGE}
              value={message}
              onChange={e => {
                setMessage(e.target.value)
                setPreview(null)
              }}
            />
          </div>
          <div className="space-y-2">
            <h3 className="font-medium">
              {t('smsCampaign.templateParameters')}
            </h3>
            {columns && columns.length > 0 ? (
              <div className="flex flex-wrap gap-2">
                {columns.map(c => (
                  <Button
                    key={c}
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => insertPlaceholder(c)}
                  >
                    {c}
                  </Button>
                ))}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">
                {t('smsCampaign.noColumns')}
              </p>
            )}
          </div>
          <div className="space-y-2">
            <Button
              type="button"
              variant="outline"
              disabled={!paramValue || !messageValid || previewing}
              onClick={runPreview}
            >
              {previewing
                ? t('common:actions.loading')
                : t('smsCampaign.previewMessage')}
            </Button>
            {preview && (
              <div className="rounded-md border border-zinc-200 dark:border-zinc-700 p-3 text-sm space-y-1">
                <p className="whitespace-pre-wrap">
                  {preview.text || t('smsCampaign.previewEmpty')}
                </p>
                {preview.count !== undefined && (
                  <p className="text-muted-foreground">
                    {t('smsCampaign.recipients', { count: preview.count })}
                  </p>
                )}
              </div>
            )}
          </div>
        </div>
      )}

      {step === 2 && (
        <dl className="grid grid-cols-1 md:grid-cols-[200px_1fr] gap-y-3 text-sm">
          <dt className="font-medium">
            {t('smsCampaign.fields.campaignName')}
          </dt>
          <dd>{campaignName}</dd>
          <dt className="font-medium">{t('smsCampaign.fields.smsProvider')}</dt>
          <dd>{notification ? t('smsCampaign.notification') : providerName}</dd>
          <dt className="font-medium">{t('smsCampaign.fields.triggerType')}</dt>
          <dd>{triggerName}</dd>
          <dt className="font-medium">
            {t('smsCampaign.fields.businessRule')}
          </dt>
          <dd>{reportName}</dd>
          {scheduled && (
            <>
              <dt className="font-medium">
                {t('smsCampaign.fields.scheduleDate')}
              </dt>
              <dd>{recurrenceStartDate.replace('T', ' ')}</dd>
            </>
          )}
          <dt className="font-medium">
            {t('smsCampaign.fields.campaignMessage')}
          </dt>
          <dd className="whitespace-pre-wrap">{message}</dd>
        </dl>
      )}

      {error && (
        <p className="text-sm text-red-600 dark:text-red-400" role="alert">
          {error}
        </p>
      )}

      <div className="flex flex-wrap justify-between gap-3">
        <Button
          type="button"
          variant="outline"
          onClick={() => navigate(cancelPath)}
          disabled={saving}
        >
          {t('common:actions.cancel')}
        </Button>
        <div className="flex gap-3">
          <Button
            type="button"
            variant="outline"
            disabled={step === 0 || saving}
            onClick={() => setStep(s => s - 1)}
          >
            {t('common:actions.previous')}
          </Button>
          {step < 2 ? (
            <Button
              type="button"
              className="bg-[#1074b9] hover:bg-[#1074c9] text-white"
              disabled={step === 0 ? !detailsValid : !messageValid}
              onClick={() => setStep(s => s + 1)}
            >
              {t('common:actions.next')}
            </Button>
          ) : (
            <Button
              type="button"
              className="bg-[#1074b9] hover:bg-[#1074c9] text-white"
              disabled={saving}
              onClick={submit}
            >
              {saving ? t('common:actions.saving') : t('common:actions.submit')}
            </Button>
          )}
        </div>
      </div>
    </div>
  )
}

export default CampaignForm
