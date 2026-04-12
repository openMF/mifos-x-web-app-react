/**
 * Copyright since 2025 Mifos Initiative
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */
import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { Trash2 } from 'lucide-react'

import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { AppBreadCrumbs } from '@/components/custom/breadcrumbs/AppBreadCrumbs'
import {
  AlertDialog,
  AlertDialogTrigger,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogFooter,
  AlertDialogCancel,
  AlertDialogAction,
} from '@/components/ui/alert-dialog'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import AppSelect from '@/components/custom/select/AppSelect'

import {
  DelinquencyRangeAndBucketsManagementApi,
  type DelinquencyRangeData,
} from '@/fineract-api'
import { getConfiguration } from '@/lib/fineract-openapi'

// API instance
const api = new DelinquencyRangeAndBucketsManagementApi(getConfiguration())

const EditDelinquencyBucket = () => {
  const { id } = useParams()
  const navigate = useNavigate()

  const [formData, setFormData] = useState({ name: '' }) // bucket name
  const [selectedRange, setSelectedRange] = useState('') // selected range id for adding
  const [addedRanges, setAddedRanges] = useState<DelinquencyRangeData[]>([]) // currently assigned ranges
  const [ranges, setRanges] = useState<DelinquencyRangeData[]>([]) // all available ranges

  // Load bucket + available ranges on mount
  useEffect(() => {
    const fetchData = async () => {
      const [rangeRes, bucketRes] = await Promise.all([
        api.getDelinquencyRanges(),
        api.getDelinquencyBucket(Number(id)),
      ])

      setRanges(rangeRes.data || [])
      setFormData({ name: bucketRes.data?.name || '' })
      setAddedRanges(bucketRes.data?.ranges || [])
    }

    fetchData().catch(err => console.error('Failed to load data', err))
  }, [id])

  // Add range to bucket
  const handleAddRange = () => {
    const rangeId = parseInt(selectedRange)
    if (!rangeId || addedRanges.some(r => r.id === rangeId)) return

    const found = ranges.find(r => r.id === rangeId)
    if (found) setAddedRanges(prev => [...prev, found])
    setSelectedRange('')
  }

  // Remove range from bucket
  const handleRemoveRange = (id: number) => {
    setAddedRanges(prev => prev.filter(r => r.id !== id))
  }

  // Submit updated bucket
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!formData.name || addedRanges.length === 0) {
      alert('Please fill all required fields.')
      return
    }

    try {
      await api.updateDelinquencyBucket(Number(id), {
        name: formData.name,
        ranges: addedRanges
          .map(r => r.id!)
          .filter((id): id is number => id !== undefined),
      })

      alert('Bucket updated successfully!')
      navigate('/products/delinquency-bucket-configurations/buckets')
    } catch (err) {
      console.error('Failed to update bucket', err)
      alert('Update failed')
    }
  }

  return (
    <div className="min-h-screen px-6 py-10 max-w-4xl mx-auto text-[15px]">
      {/* Breadcrumbs */}
      <AppBreadCrumbs
        items={[
          { label: 'Home', href: '/home' },
          { label: 'Products', href: '/products' },
          {
            label: 'Manage Delinquency Bucket Configurations',
            href: '/products/delinquency-bucket-configurations',
          },
          {
            label: 'Delinquency Buckets',
            href: '/products/delinquency-bucket-configurations/buckets',
          },
          { label: 'Edit', current: true },
        ]}
      />

      {/* Edit form */}
      <div className="bg-white dark:bg-zinc-900 border rounded-md shadow p-8">
        <h2 className="text-2xl font-semibold mb-6">Edit</h2>

        <form className="space-y-6" onSubmit={handleSubmit}>
          {/* Bucket name */}
          <div>
            <Label>Name*</Label>
            <Input
              value={formData.name}
              onChange={e => setFormData({ name: e.target.value })}
            />
          </div>

          {/* Range selection + table */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label>Delinquency Ranges</Label>
              {/* Add range modal */}
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button size="sm" className="bg-[#1074b9] text-white">
                    + Add
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Select Range</AlertDialogTitle>
                  </AlertDialogHeader>
                  <AppSelect
                    selectLabel="Delinquency Range"
                    selectValue={selectedRange}
                    selectOnChange={setSelectedRange}
                    selectPlaceholder="Choose a range"
                    selectOptions={ranges.map(r => ({
                      id: String(r.id),
                      name: `${r.classification} (${r.minimumAgeDays}–${r.maximumAgeDays})`,
                    }))}
                  />
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                    <AlertDialogAction
                      className="bg-[#1074b9] text-white"
                      onClick={handleAddRange}
                    >
                      Add
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </div>

            {/* Show added ranges */}
            {addedRanges.length > 0 && (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Classification</TableHead>
                    <TableHead>From</TableHead>
                    <TableHead>To</TableHead>
                    <TableHead>Action</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {addedRanges.map(r => (
                    <TableRow key={r.id}>
                      <TableCell>{r.classification}</TableCell>
                      <TableCell>{r.minimumAgeDays}</TableCell>
                      <TableCell>{r.maximumAgeDays}</TableCell>
                      <TableCell>
                        <Button
                          type="button"
                          variant="ghost"
                          className="text-red-600 hover:text-red-700"
                          onClick={() => handleRemoveRange(r.id!)}
                        >
                          <Trash2 size={16} />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </div>

          {/* Actions */}
          <div className="flex justify-end gap-3 pt-6">
            <Button
              type="button"
              variant="outline"
              onClick={() =>
                navigate('/products/delinquency-bucket-configurations/buckets')
              }
            >
              Cancel
            </Button>
            <Button
              type="submit"
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

export default EditDelinquencyBucket
