/**
 * Copyright since 2025 Mifos Initiative
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */
import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { AppBreadCrumbs } from '@/components/custom/breadcrumbs/AppBreadCrumbs'
import AppSelect from '@/components/custom/select/AppSelect'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { Checkbox } from '@/components/ui/checkbox'

const CreateGuarantor = () => {
  const navigate = useNavigate()

  const [existingClient, setExistingClient] = useState(true)
  const [name, setName] = useState('')
  const [relationshipId, setRelationshipId] = useState('')

  const canSubmit = Boolean(name)

  const onSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!canSubmit) return
    navigate(-1)
  }

  return (
    <div className="min-h-screen px-6 py-10 bg-gray-50 dark:bg-zinc-900">
      <AppBreadCrumbs
        items={[
          { label: 'Home', href: '/home' },
          { label: 'Groups', href: '/groups' },
          { label: 'Create Guarantor', current: true },
        ]}
      />

      <div className="bg-white dark:bg-zinc-800 shadow-md rounded-lg p-8 max-w-3xl mx-auto">
        <h2 className="text-2xl font-semibold mb-6">Create Guarantor</h2>

        <form onSubmit={onSubmit} className="space-y-6">
          {/* Existing Client toggle */}
          <div className="flex items-center gap-3">
            <Label className="text-base">Existing Client</Label>
            <Checkbox
              checked={existingClient}
              onCheckedChange={v => setExistingClient(Boolean(v))}
            />
          </div>

          {/* Name */}
          <div className="w-full space-y-2">
            <Label>Name*</Label>
            <Input
              value={name}
              onChange={e => setName(e.target.value)}
              placeholder="Enter name"
            />
          </div>

          {/* Relationship */}
          <div className="w-full space-y-2">
            {
              <AppSelect
                selectLabel="Relationship"
                selectPlaceholder="Select relationship"
                selectValue={relationshipId}
                selectOnChange={setRelationshipId}
                selectOptions={[]}
                selectClassname="w-full space-y-2"
              />
            }
          </div>

          {/* Actions */}
          <div className="flex gap-4 pt-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => navigate(-1)}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={!canSubmit}
              className="bg-[#1074b9] hover:bg-[#1074c9] text-white"
            >
              Submit
            </Button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default CreateGuarantor
