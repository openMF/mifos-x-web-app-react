/**
 * Copyright since 2025 Mifos Initiative
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */
import { useCallback, useEffect, useRef, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { useTranslation } from 'react-i18next'

import { AppBreadCrumbs } from '@/components/custom/breadcrumbs/AppBreadCrumbs'
import AppSelect from '@/components/custom/select/AppSelect'
import { Button } from '@/components/ui/button'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import fineract from '@/lib/axios'
import { formatDate, todayInputValue } from '@/lib/date-utils'

import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import {
  faLockOpen,
  faPen,
  faTimes,
  faTrash,
  faUndo,
} from '@fortawesome/free-solid-svg-icons'

import { CampaignStatus } from './CampaignStatus'
import {
  apiErrorMessage,
  DATE_FORMAT,
  LOCALE,
  toApiDate,
  type SmsCampaign,
} from './types'

/** The three status changes, each sent with a date as in the Angular web app */
type Command = 'activate' | 'close' | 'reactivate'
const DATE_FIELD: Record<Command, string> = {
  activate: 'activationDate',
  close: 'closureDate',
  reactivate: 'activationDate',
}

/** Message statuses of GET /sms/{campaignId}/messageByStatus */
const MESSAGE_STATUSES = [
  { id: 100, key: 'pending' },
  { id: 150, key: 'waiting' },
  { id: 200, key: 'sent' },
  { id: 300, key: 'delivered' },
  { id: 400, key: 'failed' },
] as const

type Sms = {
  id?: number
  message?: string
  mobileNo?: string
  campaignName?: string
  status?: { value?: string }
}

/** View an SMS campaign, change its status, and list its messages */
const ViewSmsCampaign = () => {
  const { id } = useParams<{ id: string }>()
  const { t, i18n } = useTranslation(['organization', 'common'])
  const navigate = useNavigate()
  const [campaign, setCampaign] = useState<SmsCampaign | null>(null)
  const [error, setError] = useState<string | null>(null)

  const [command, setCommand] = useState<Command | null>(null)
  const [commandDate, setCommandDate] = useState('')
  const [commandError, setCommandError] = useState<string | null>(null)
  const [running, setRunning] = useState(false)

  const [confirmDelete, setConfirmDelete] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [deleteError, setDeleteError] = useState<string | null>(null)

  const [messageStatus, setMessageStatus] = useState('')
  const [fromDate, setFromDate] = useState('')
  const [toDate, setToDate] = useState('')
  const [messages, setMessages] = useState<Sms[] | null>(null)
  const [searching, setSearching] = useState(false)
  const [searchError, setSearchError] = useState<string | null>(null)
  const searchRequest = useRef(0)

  const load = useCallback(async () => {
    if (!id) return
    // A reload (e.g. after a status command) must not keep an earlier load error
    setError(null)
    try {
      const res = await fineract.get<SmsCampaign>(`v1/smscampaigns/${id}`)
      setCampaign(res.data ?? {})
    } catch (err) {
      setError(apiErrorMessage(err, t('smsCampaign.errors.load')))
    }
  }, [id, t])

  useEffect(() => {
    load()
  }, [load])

  const status = (campaign?.campaignStatus?.value ?? '').toLowerCase()

  const runCommand = async () => {
    if (!command || !commandDate || running) return
    setRunning(true)
    setCommandError(null)
    try {
      await fineract.post(
        `v1/smscampaigns/${id}`,
        {
          [DATE_FIELD[command]]: toApiDate(commandDate),
          dateFormat: DATE_FORMAT,
          locale: LOCALE,
        },
        { params: { command } }
      )
      setCommand(null)
      await load()
    } catch (err) {
      setCommandError(apiErrorMessage(err, t(`smsCampaign.errors.${command}`)))
    } finally {
      setRunning(false)
    }
  }

  const handleDelete = async () => {
    if (deleting) return
    setDeleting(true)
    setDeleteError(null)
    try {
      await fineract.delete(`v1/smscampaigns/${id}`)
      setConfirmDelete(false)
      navigate('/organization/sms-campaigns')
    } catch (err) {
      setDeleteError(apiErrorMessage(err, t('smsCampaign.errors.delete')))
      setDeleting(false)
    }
  }

  const oneDateOnly = Boolean(fromDate) !== Boolean(toDate)

  const search = async () => {
    if (!messageStatus || oneDateOnly) return
    // Only the latest search may fill the table
    const request = ++searchRequest.current
    setSearching(true)
    setSearchError(null)
    try {
      const res = await fineract.get<{ pageItems?: Sms[] }>(
        `v1/sms/${id}/messageByStatus`,
        {
          params: {
            status: messageStatus,
            locale: LOCALE,
            dateFormat: DATE_FORMAT,
            // Fineract filters by date only when both are set
            ...(fromDate && toDate
              ? { fromDate: toApiDate(fromDate), toDate: toApiDate(toDate) }
              : {}),
          },
        }
      )
      if (request !== searchRequest.current) return
      setMessages(res.data?.pageItems ?? [])
    } catch (err) {
      if (request !== searchRequest.current) return
      setMessages(null)
      setSearchError(apiErrorMessage(err, t('smsCampaign.errors.messages')))
    } finally {
      if (request === searchRequest.current) setSearching(false)
    }
  }

  const openCommand = (c: Command) => {
    setCommand(c)
    setCommandDate(todayInputValue())
    setCommandError(null)
  }

  const timeline = campaign?.smsCampaignTimeLine
  const rows: [string, React.ReactNode][] = campaign
    ? [
        [t('smsCampaign.fields.campaignName'), campaign.campaignName],
        [t('smsCampaign.fields.businessRule'), campaign.reportName],
        [
          t('smsCampaign.fields.status'),
          <CampaignStatus status={campaign.campaignStatus} />,
        ],
        [t('smsCampaign.fields.triggerType'), campaign.triggerType?.value],
        [t('smsCampaign.fields.campaignType'), campaign.campaignType?.value],
        [
          t('smsCampaign.fields.submittedOn'),
          `${formatDate(timeline?.submittedOnDate, i18n.language)}${
            timeline?.submittedByUsername
              ? ` • ${timeline.submittedByUsername}`
              : ''
          }`,
        ],
        ...(timeline?.activatedOnDate
          ? ([
              [
                t('smsCampaign.fields.activatedOn'),
                `${formatDate(timeline.activatedOnDate, i18n.language)}${
                  timeline.activatedByUsername
                    ? ` • ${timeline.activatedByUsername}`
                    : ''
                }`,
              ],
            ] as [string, React.ReactNode][])
          : []),
        ...(timeline?.closedOnDate
          ? ([
              [
                t('smsCampaign.fields.closedOn'),
                `${formatDate(timeline.closedOnDate, i18n.language)}${
                  timeline.closedByUsername
                    ? ` • ${timeline.closedByUsername}`
                    : ''
                }`,
              ],
            ] as [string, React.ReactNode][])
          : []),
        ...(campaign.recurrence
          ? ([[t('smsCampaign.fields.recurrence'), campaign.recurrence]] as [
              string,
              React.ReactNode,
            ][])
          : []),
      ]
    : []

  return (
    <div className="min-h-screen px-6 py-10 max-w-7xl mx-auto text-[15px]">
      <AppBreadCrumbs
        items={[
          { label: t('common:nav.home'), href: '/home' },
          { label: t('title'), href: '/organization' },
          {
            label: t('smsCampaign.title'),
            href: '/organization/sms-campaigns',
          },
          { label: campaign?.campaignName ?? id ?? '', current: true },
        ]}
      />

      {/* Actions only once the campaign has loaded, by status as in Angular */}
      {campaign && (
        <div className="flex flex-wrap gap-3 mb-6">
          {status !== 'active' && (
            <Button
              className="bg-[#1074b9] hover:bg-[#1074c9] text-white"
              onClick={() => navigate(`/organization/sms-campaigns/${id}/edit`)}
            >
              <FontAwesomeIcon icon={faPen} className="mr-2" />
              {t('common:actions.edit')}
            </Button>
          )}
          {status === 'pending' && (
            <Button variant="outline" onClick={() => openCommand('activate')}>
              <FontAwesomeIcon icon={faLockOpen} className="mr-2" />
              {t('common:actions.activate')}
            </Button>
          )}
          {status !== 'closed' && (
            <Button variant="outline" onClick={() => openCommand('close')}>
              <FontAwesomeIcon icon={faTimes} className="mr-2" />
              {t('common:actions.close')}
            </Button>
          )}
          {status === 'closed' && (
            <Button variant="outline" onClick={() => openCommand('reactivate')}>
              <FontAwesomeIcon icon={faUndo} className="mr-2" />
              {t('smsCampaign.reactivate')}
            </Button>
          )}
          {status === 'closed' && (
            <Button
              className="bg-red-600 hover:bg-red-700 text-white"
              onClick={() => {
                setDeleteError(null)
                setConfirmDelete(true)
              }}
            >
              <FontAwesomeIcon icon={faTrash} className="mr-2" />
              {t('common:actions.delete')}
            </Button>
          )}
        </div>
      )}

      {error && (
        <div className="mb-6 rounded-md border border-red-300 bg-red-50 px-4 py-2 text-sm text-red-700 dark:border-red-700 dark:bg-red-950 dark:text-red-300">
          {error}
        </div>
      )}

      {campaign && (
        <div className="space-y-6">
          <div className="bg-white dark:bg-zinc-800 rounded-lg border border-zinc-200 dark:border-zinc-700 shadow-sm p-6">
            <dl className="grid grid-cols-1 md:grid-cols-[200px_1fr] gap-y-3">
              {rows.map(([label, value]) => (
                <div key={label} className="contents">
                  <dt className="font-medium">{label}</dt>
                  <dd>{value || '—'}</dd>
                </div>
              ))}
            </dl>
            <h3 className="font-medium mt-6 mb-2">
              {t('smsCampaign.fields.templateMessage')}
            </h3>
            <p className="whitespace-pre-wrap rounded-md border border-zinc-200 dark:border-zinc-700 p-3 text-sm">
              {campaign.campaignMessage || '—'}
            </p>
          </div>

          <div className="bg-white dark:bg-zinc-800 rounded-lg border border-zinc-200 dark:border-zinc-700 shadow-sm p-6 space-y-4">
            <h2 className="text-lg font-semibold">
              {t('smsCampaign.messages.title')}
            </h2>
            <div className="flex flex-wrap items-end gap-4">
              <AppSelect
                selectLabel={t('smsCampaign.fields.status')}
                selectPlaceholder={t('smsCampaign.messages.selectStatus')}
                selectValue={messageStatus}
                selectOnChange={v => {
                  setMessageStatus(v)
                  setMessages(null)
                }}
                selectOptions={MESSAGE_STATUSES.map(s => ({
                  id: s.id,
                  name: t(`smsCampaign.messages.status.${s.key}`),
                }))}
                selectClassname="w-full md:w-60 space-y-2"
              />
              <div className="space-y-2">
                <Label htmlFor="fromDate">
                  {t('smsCampaign.messages.fromDate')}
                </Label>
                <Input
                  id="fromDate"
                  type="date"
                  max={toDate || todayInputValue()}
                  value={fromDate}
                  onChange={e => setFromDate(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="toDate">
                  {t('smsCampaign.messages.toDate')}
                </Label>
                <Input
                  id="toDate"
                  type="date"
                  min={fromDate || undefined}
                  max={todayInputValue()}
                  value={toDate}
                  onChange={e => setToDate(e.target.value)}
                />
              </div>
              <Button
                className="bg-[#1074b9] hover:bg-[#1074c9] text-white"
                disabled={!messageStatus || oneDateOnly || searching}
                onClick={search}
              >
                {searching
                  ? t('common:actions.loading')
                  : t('common:actions.search')}
              </Button>
            </div>
            {oneDateOnly && (
              <p className="text-xs text-muted-foreground">
                {t('smsCampaign.messages.bothDates')}
              </p>
            )}
            {searchError && (
              <p className="text-sm text-red-600 dark:text-red-400">
                {searchError}
              </p>
            )}
            {messages && (
              <Table>
                <TableCaption>
                  {messages.length
                    ? t('smsCampaign.messages.count', {
                        count: messages.length,
                      })
                    : t('smsCampaign.messages.empty')}
                </TableCaption>
                <TableHeader>
                  <TableRow>
                    <TableHead>{t('smsCampaign.messages.message')}</TableHead>
                    <TableHead>{t('smsCampaign.fields.status')}</TableHead>
                    <TableHead>{t('smsCampaign.messages.mobileNo')}</TableHead>
                    <TableHead>
                      {t('smsCampaign.fields.campaignName')}
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {messages.map((m, i) => (
                    <TableRow key={m.id ?? i}>
                      <TableCell className="whitespace-pre-wrap">
                        {m.message}
                      </TableCell>
                      <TableCell>{m.status?.value ?? '—'}</TableCell>
                      <TableCell>{m.mobileNo ?? '—'}</TableCell>
                      <TableCell>{m.campaignName ?? '—'}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </div>
        </div>
      )}

      <Dialog
        open={command !== null}
        onOpenChange={open => {
          if (!open && !running) setCommand(null)
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {command && t(`smsCampaign.commands.${command}.title`)}
            </DialogTitle>
            <DialogDescription>
              {command && t(`smsCampaign.commands.${command}.description`)}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-2">
            <Label htmlFor="commandDate">
              {command && t(`smsCampaign.commands.${command}.date`)} *
            </Label>
            <Input
              id="commandDate"
              type="date"
              max={todayInputValue()}
              value={commandDate}
              onChange={e => setCommandDate(e.target.value)}
            />
          </div>
          {commandError && (
            <p className="text-sm text-red-600 dark:text-red-400" role="alert">
              {commandError}
            </p>
          )}
          <DialogFooter>
            <Button
              variant="outline"
              disabled={running}
              onClick={() => setCommand(null)}
            >
              {t('common:actions.cancel')}
            </Button>
            <Button
              className="bg-[#1074b9] hover:bg-[#1074c9] text-white"
              disabled={!commandDate || running}
              onClick={runCommand}
            >
              {running ? t('common:actions.saving') : t('smsCampaign.confirm')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog
        open={confirmDelete}
        onOpenChange={open => {
          if (!deleting) {
            setConfirmDelete(open)
            setDeleteError(null)
          }
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t('common:actions.delete')}</AlertDialogTitle>
            <AlertDialogDescription>
              {t('smsCampaign.deleteDialog.confirm', {
                name: campaign?.campaignName ?? '',
              })}
            </AlertDialogDescription>
          </AlertDialogHeader>
          {deleteError && (
            <p className="text-sm text-red-600 dark:text-red-400">
              {deleteError}
            </p>
          )}
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleting}>
              {t('common:actions.cancel')}
            </AlertDialogCancel>
            <AlertDialogAction
              className="bg-red-600 hover:bg-red-700 text-white"
              disabled={deleting}
              onClick={e => {
                // Keep the dialog open until the request finishes
                e.preventDefault()
                handleDelete()
              }}
            >
              {deleting
                ? t('smsCampaign.deleteDialog.deleting')
                : t('smsCampaign.confirm')}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}

export default ViewSmsCampaign
