/**
 * Copyright since 2025 Mifos Initiative
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */
import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { AppBreadCrumbs } from '@/components/custom/breadcrumbs/AppBreadCrumbs'
import {
  RolesApi,
  type GetRolesRoleIdResponse,
  type PutRolesRoleIdRequest,
} from '@/fineract-api'
import { getConfiguration } from '@/lib/fineract-openapi'
import { envConfig } from '@/lib/env-config'
import { updateOidcRole } from '@/lib/oidc-users-api'

const rolesApi = new RolesApi(getConfiguration())

const EditRolesAndPermissions = () => {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()

  const [role, setRole] = useState<GetRolesRoleIdResponse | null>(null)
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [initialDescription, setInitialDescription] = useState('')
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let ignore = false

    setRole(null)
    setName('')
    setDescription('')
    setInitialDescription('')
    setError(null)
    setLoading(true)
    setSubmitting(false)

    if (!id) {
      setError('Role id is missing.')
      setLoading(false)
      return
    }

    const roleId = Number(id)
    if (!Number.isInteger(roleId) || roleId <= 0) {
      setError('Invalid role id.')
      setLoading(false)
      return
    }

    const loadRole = async () => {
      try {
        const response = await rolesApi.retrieveRole(roleId)
        if (ignore) return

        const data = response.data ?? {}
        setRole(data)
        setName(data.name ?? '')
        setDescription(data.description ?? '')
        setInitialDescription(data.description ?? '')
      } catch (loadError) {
        if (ignore) return
        console.error('Failed to fetch role', loadError)
        setError('Failed to load role details.')
      } finally {
        if (!ignore) setLoading(false)
      }
    }

    loadRole()

    return () => {
      ignore = true
    }
  }, [id])

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault()
    if (!id || !role?.id) return
    if (Number(id) !== role.id) return

    const trimmedDescription = description.trim()
    if (!trimmedDescription) {
      setError('Description is required.')
      return
    }

    setSubmitting(true)
    setError(null)

    try {
      const request: PutRolesRoleIdRequest = {
        description: trimmedDescription,
      }
      await rolesApi.updateRole(role.id, request)

      if (envConfig.oidcEnabled) {
        try {
          await updateOidcRole(role.id, name, trimmedDescription)
        } catch (oidcError) {
          console.error(
            'Failed to update role in the identity provider',
            oidcError
          )
          setError(
            'Fineract was updated, but identity-provider synchronization failed or could not be confirmed.'
          )
          setSubmitting(false)
          return
        }
      }

      navigate('/system/roles-and-permissions')
    } catch (submitError) {
      console.error('Failed to update role', submitError)
      setError('Failed to update role.')
      setSubmitting(false)
    }
  }

  const descriptionChanged = description.trim() !== initialDescription.trim()
  const descriptionValid = description.trim().length > 0
  const roleMatchesRoute = role?.id !== undefined && Number(id) === role.id

  return (
    <div className="min-h-screen px-6 py-10 max-w-7xl mx-auto text-[15px]">
      <AppBreadCrumbs
        items={[
          { label: 'Home', href: '/home' },
          { label: 'System', href: '/system' },
          {
            label: 'Roles and Permissions',
            href: '/system/roles-and-permissions',
          },
          { label: role?.name ?? id ?? '', current: true },
        ]}
      />

      <div className="bg-white dark:bg-zinc-900 rounded-md border p-8 shadow max-w-xl mx-auto">
        <h2 className="text-2xl font-semibold mb-6">Edit</h2>

        {loading ? (
          <div className="text-sm text-muted-foreground">
            Loading role details...
          </div>
        ) : (
          <form className="space-y-6" onSubmit={handleSubmit}>
            <div className="w-full space-y-2">
              <Label htmlFor="roleName">Role Name</Label>
              <Input
                id="roleName"
                value={name}
                disabled
                className="bg-muted text-muted-foreground"
              />
            </div>

            <div className="w-full space-y-2">
              <Label htmlFor="roleDescription">Role Description*</Label>
              <Input
                id="roleDescription"
                value={description}
                required
                disabled={submitting || !role}
                onChange={event => {
                  setDescription(event.target.value)
                  setError(null)
                }}
              />
            </div>

            {error && (
              <div className="rounded-md border border-red-300 bg-red-50 px-4 py-2 text-sm text-red-700 dark:border-red-700 dark:bg-red-950 dark:text-red-300">
                {error}
              </div>
            )}

            <div className="flex justify-center gap-4 pt-2">
              <Button
                type="button"
                variant="outline"
                disabled={submitting}
                onClick={() => navigate('/system/roles-and-permissions')}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                className="bg-[#1074b9] hover:bg-[#1074c9] text-white"
                disabled={
                  submitting ||
                  loading ||
                  !role ||
                  !roleMatchesRoute ||
                  !descriptionValid ||
                  !descriptionChanged
                }
              >
                Submit
              </Button>
            </div>
          </form>
        )}
      </div>
    </div>
  )
}

export default EditRolesAndPermissions
