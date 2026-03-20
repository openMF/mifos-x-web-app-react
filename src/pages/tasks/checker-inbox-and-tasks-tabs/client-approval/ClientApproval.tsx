/**
 * Copyright since 2025 Mifos Initiative
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */
import { useEffect, useState } from 'react'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { useNavigate } from 'react-router-dom'
import { BatchAPIApi, ClientApi, type ClientData } from '@/fineract-api'
import { getConfiguration } from '@/lib/fineract-openapi'

const clientsApi = new ClientApi(getConfiguration())
const batchApi = new BatchAPIApi(getConfiguration())

const ClientApproval = () => {
  const navigate = useNavigate()
  const [filter, setFilter] = useState('')
  const [selected, setSelected] = useState<number[]>([])
  const [groupedClients, setGroupedClients] = useState<
    Record<string, ClientData[]>
  >({})
  const [hasClients, setHasClients] = useState(false)

  useEffect(() => {
    const fetchData = async () => {
      try {
        const res = await clientsApi.retrieveAll21(
          undefined,
          undefined,
          undefined,
          undefined,
          undefined,
          'PENDING',
          undefined,
          undefined,
          1000
        )
        const pageItems = res.data.pageItems ?? []

        const grouped = pageItems.reduce(
          (acc: Record<string, ClientData[]>, client) => {
            const group = client.officeName || 'Unassigned'
            if (!acc[group]) acc[group] = []
            acc[group].push(client)
            return acc
          },
          {}
        )

        setGroupedClients(grouped)
        setHasClients(pageItems.length > 0)
      } catch (err) {
        console.error('Error fetching clients:', err)
      }
    }
    fetchData()
  }, [])

  const toggle = (id: number) => {
    setSelected(prev =>
      prev.includes(id) ? prev.filter(v => v !== id) : [...prev, id]
    )
  }

  const masterToggle = (clients: ClientData[]) => {
    const allSelected = clients.every(client => selected.includes(client.id!))
    if (allSelected) {
      setSelected(prev => prev.filter(id => !clients.find(c => c.id === id)))
    } else {
      setSelected(prev => [
        ...prev,
        ...clients.map(c => c.id!).filter(id => !prev.includes(id)),
      ])
    }
  }

  const handleApprove = async (e: React.FormEvent) => {
    e.preventDefault()

    if (selected.length === 0) {
      alert('No clients selected for approval.')
      return
    }

    const today = new Date()
    const formattedDate = today.toLocaleDateString('en-GB', {
      day: '2-digit',
      month: 'long',
      year: 'numeric',
    })

    const batchPayload = selected.map((clientId, index) => ({
      requestId: index + 1,
      method: 'POST',
      relativeUrl: `clients/${clientId}?command=activate`,
      body: JSON.stringify({
        activationDate: formattedDate,
        dateFormat: 'dd MMMM yyyy',
        locale: 'en',
      }),
    }))

    try {
      await batchApi.handleBatchRequests(batchPayload, true)
      alert('Selected clients approved successfully.')
      setSelected([]) // Clear the selection
    } catch (error) {
      console.error('Batch approval failed:', error)
      alert('Failed to approve one or more clients.')
    }
  }

  return (
    <div className="space-y-8 ">
      {hasClients ? (
        <>
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <Input
              placeholder="Filter by name"
              value={filter}
              onChange={e => setFilter(e.target.value)}
              className="sm:w-1/2"
            />
            <Button
              className="bg-green-600 hover:bg-green-700 text-white transition-all cursor-pointer"
              onClick={handleApprove}
            >
              Approve
            </Button>
          </div>

          {Object.keys(groupedClients).map(group => {
            const clients = groupedClients[group]
            return (
              <div key={group} className="space-y-4">
                <h3 className="text-lg font-semibold text-zinc-800 dark:text-zinc-200">
                  {group}
                </h3>

                {clients.length > 0 && (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>
                          <Checkbox
                            checked={clients.every(c =>
                              selected.includes(c.id!)
                            )}
                            onCheckedChange={() => masterToggle(clients)}
                          />
                        </TableHead>
                        <TableHead>Name</TableHead>
                        <TableHead>Account Number</TableHead>
                        <TableHead>Staff</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {clients
                        .filter(c =>
                          c.displayName
                            ?.toLowerCase()
                            .includes(filter.toLowerCase())
                        )
                        .map(client =>
                          client.id ? (
                            <TableRow
                              key={client.id}
                              className="hover:bg-muted/50 cursor-pointer"
                            >
                              <TableCell>
                                <Checkbox
                                  checked={selected.includes(client.id)}
                                  onCheckedChange={() => toggle(client.id!)}
                                />
                              </TableCell>
                              <TableCell
                                className=""
                                onClick={() =>
                                  navigate(`/clients/${client.id}`)
                                }
                              >
                                {client.displayName}
                              </TableCell>
                              <TableCell
                                className=""
                                onClick={() =>
                                  navigate(`/clients/${client.id}`)
                                }
                              >
                                {client.accountNo}
                              </TableCell>
                              <TableCell className="text-sm text-muted-foreground">
                                {client.staffName ?? '-'}
                              </TableCell>
                            </TableRow>
                          ) : null
                        )}
                    </TableBody>
                  </Table>
                )}
              </div>
            )
          })}
        </>
      ) : (
        <div className="text-center py-8 text-muted-foreground text-sm">
          No pending clients for approval.
        </div>
      )}
    </div>
  )
}

export default ClientApproval
