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
import { Plus } from 'lucide-react'

import {
  ClientFamilyMemberApi,
  type ClientFamilyMembersData,
} from '@/fineract-api'
import { getConfiguration } from '@/lib/fineract-openapi'
import { formatDate } from '@/lib/date-utils'

import type { RouteSuccessState } from '@/components/custom/route-success-message/RouteSuccessMessage'

import { Button } from '@/components/ui/button'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'

// Built per call so it picks up the current credentials; see EntityDocumentsTab.
const familyMemberApi = () => new ClientFamilyMemberApi(getConfiguration())

/**
 * Fineract sends the date of birth as "yyyy-MM-dd". It is split into parts so
 * formatDate reads it as a local date: parsed as a string, it is UTC midnight
 * and shows the previous day west of UTC.
 */
const dateOfBirthParts = (value?: string | number[]) =>
  Array.isArray(value) ? value : value?.split('-').map(Number)

const ClientsFamilyMembersTab = () => {
  const { id } = useParams()
  const navigate = useNavigate()
  const { t, i18n } = useTranslation('clients')
  const { t: tc } = useTranslation('common')

  const [members, setMembers] = useState<ClientFamilyMembersData[]>([])
  const [loading, setLoading] = useState(true)
  const [failed, setFailed] = useState(false)
  const [deleteError, setDeleteError] = useState('')
  /** The member being deleted; Delete stays disabled until the request settles. */
  const [deletingId, setDeletingId] = useState<number>()
  const deletingRef = useRef(false)
  /** Identifies the newest request, so a response for a previous client is discarded. */
  const loadIdRef = useRef(0)

  const load = useCallback(async () => {
    const requestId = ++loadIdRef.current
    if (!id) {
      setMembers([])
      setLoading(false)
      return
    }
    setLoading(true)
    setFailed(false)
    try {
      const res = await familyMemberApi().getFamilyMembers(Number(id))
      if (requestId !== loadIdRef.current) return
      setMembers(res?.data ?? [])
    } catch (e) {
      if (requestId !== loadIdRef.current) return
      console.error('Failed to load client family members', e)
      setMembers([])
      setFailed(true)
    } finally {
      if (requestId === loadIdRef.current) setLoading(false)
    }
  }, [id])

  useEffect(() => {
    setDeleteError('')
    load()
  }, [load])

  const deleteMember = async (memberId?: number) => {
    if (!id || memberId === undefined || deletingRef.current) return
    if (!confirm(t('familyMembers.confirmDelete'))) return
    deletingRef.current = true
    setDeletingId(memberId)
    setDeleteError('')
    try {
      await familyMemberApi().deleteClientFamilyMembers(memberId, Number(id))
      const state: RouteSuccessState = {
        successMessage: t('success.familyMemberDeleted'),
      }
      navigate(`/clients/${id}/family-members`, { replace: true, state })
      await load()
    } catch (e) {
      console.error('Failed to delete client family member', e)
      setDeleteError(t('familyMembers.deleteFailed'))
    } finally {
      deletingRef.current = false
      setDeletingId(undefined)
    }
  }

  return (
    <div className="bg-transparent space-y-6">
      <div className="flex items-center justify-between p-4">
        <h3 className="text-lg font-semibold text-black dark:text-white">
          {t('familyMembers.heading')}
        </h3>
        <Button
          className="bg-[#0e77b7] hover:bg-[#0662a3] text-white rounded-md border-0 shadow-none"
          onClick={() => navigate(`/clients/${id}/family-members/add`)}
        >
          <Plus /> {t('familyMembers.addButton')}
        </Button>
      </div>

      {deleteError && (
        <p className="px-4 text-sm text-red-600">{deleteError}</p>
      )}

      {loading ? (
        <p className="px-4 text-sm text-zinc-500">
          {t('familyMembers.loading')}
        </p>
      ) : failed ? (
        <p className="px-4 text-sm text-red-600">
          {t('familyMembers.loadFailed')}
        </p>
      ) : members.length === 0 ? (
        <p className="px-4 text-sm text-zinc-500">{t('familyMembers.empty')}</p>
      ) : (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>{t('familyMembers.columnName')}</TableHead>
              <TableHead>{t('familyMembers.columnRelationship')}</TableHead>
              <TableHead>{t('familyMembers.columnGender')}</TableHead>
              <TableHead>{t('familyMembers.columnAge')}</TableHead>
              <TableHead>{t('familyMembers.columnDateOfBirth')}</TableHead>
              <TableHead>{t('familyMembers.columnIsDependent')}</TableHead>
              <TableHead className="text-right">
                {t('familyMembers.columnActions')}
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {members.map(member => (
              <TableRow key={member.id}>
                <TableCell>
                  {[member.firstName, member.middleName, member.lastName]
                    .filter(Boolean)
                    .join(' ')}
                </TableCell>
                <TableCell>{member.relationship || '—'}</TableCell>
                <TableCell>{member.gender || '—'}</TableCell>
                <TableCell>{member.age ?? '—'}</TableCell>
                <TableCell>
                  {formatDate(
                    dateOfBirthParts(member.dateOfBirth),
                    i18n.language
                  )}
                </TableCell>
                <TableCell>
                  {member.isDependent ? tc('actions.yes') : tc('actions.no')}
                </TableCell>
                <TableCell className="text-right">
                  <div className="inline-flex gap-2">
                    <Button
                      size="sm"
                      className="bg-[#0e77b7] hover:bg-[#0662a3] text-white"
                      onClick={() =>
                        navigate(
                          `/clients/${id}/family-members/${member.id}/edit`
                        )
                      }
                    >
                      {t('familyMembers.editButton')}
                    </Button>
                    <Button
                      size="sm"
                      variant="destructive"
                      disabled={deletingId !== undefined}
                      onClick={() => deleteMember(member.id)}
                    >
                      {t('familyMembers.deleteButton')}
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}
    </div>
  )
}

export default ClientsFamilyMembersTab
