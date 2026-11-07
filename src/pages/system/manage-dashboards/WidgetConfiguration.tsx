/**
 * Copyright since 2025 Mifos Initiative
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */
import { useState } from 'react'
import { useTranslation } from 'react-i18next'

import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Switch } from '@/components/ui/switch'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'

import { MODULES, WIDGETS, type WidgetId, type WidgetModule } from './widgets'

/**
 * The Widget Configuration tab: shows or hides each widget of the overview.
 * The Angular web app also assigns roles to widgets here, but nothing stores
 * or enforces them, so that part is left out.
 */
const WidgetConfiguration = ({
  hidden,
  onToggle,
}: {
  hidden: WidgetId[]
  onToggle: (id: WidgetId) => void
}) => {
  const { t } = useTranslation('organization')
  const [search, setSearch] = useState('')
  const [module, setModule] = useState<WidgetModule | 'all'>('all')

  const term = search.trim().toLowerCase()
  const widgets = WIDGETS.filter(
    widget =>
      (module === 'all' || widget.module === module) &&
      [
        t(`manageDashboards.widgets.items.${widget.id}.name`),
        t(`manageDashboards.widgets.items.${widget.id}.description`),
      ].some(text => text.toLowerCase().includes(term))
  )

  return (
    <div className="space-y-4">
      <p className="text-sm text-muted-foreground">
        {t('manageDashboards.widgets.note')}
      </p>
      <div className="flex flex-col gap-3 sm:flex-row">
        <Input
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder={t('manageDashboards.widgets.search')}
          aria-label={t('manageDashboards.widgets.search')}
          className="sm:max-w-sm"
        />
        <Select
          value={module}
          onValueChange={value => setModule(value as WidgetModule | 'all')}
        >
          <SelectTrigger
            className="sm:w-48"
            aria-label={t('manageDashboards.widgets.module')}
          >
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {(['all', ...MODULES] as const).map(value => (
              <SelectItem key={value} value={value}>
                {t(`manageDashboards.widgets.modules.${value}`)}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="overflow-x-auto rounded-lg border bg-white dark:bg-zinc-800">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>{t('manageDashboards.widgets.name')}</TableHead>
              <TableHead>{t('manageDashboards.widgets.module')}</TableHead>
              <TableHead>{t('manageDashboards.widgets.description')}</TableHead>
              <TableHead className="text-right">
                {t('manageDashboards.widgets.visible')}
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {widgets.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={4}
                  className="py-8 text-center text-muted-foreground"
                >
                  {t('manageDashboards.widgets.noMatch')}
                </TableCell>
              </TableRow>
            ) : (
              widgets.map(widget => {
                const name = t(
                  `manageDashboards.widgets.items.${widget.id}.name`
                )
                return (
                  <TableRow key={widget.id}>
                    <TableCell className="font-medium">{name}</TableCell>
                    <TableCell>
                      {t(`manageDashboards.widgets.modules.${widget.module}`)}
                    </TableCell>
                    <TableCell className="whitespace-normal text-muted-foreground">
                      {t(
                        `manageDashboards.widgets.items.${widget.id}.description`
                      )}
                    </TableCell>
                    <TableCell className="text-right">
                      <Switch
                        checked={!hidden.includes(widget.id)}
                        onCheckedChange={() => onToggle(widget.id)}
                        aria-label={name}
                      />
                    </TableCell>
                  </TableRow>
                )
              })
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  )
}

export default WidgetConfiguration
