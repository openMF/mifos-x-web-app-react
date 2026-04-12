/**
 * Copyright since 2025 Mifos Initiative
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */
import { Input } from '@/components/ui/input'

interface AppSearchProps {
  placeholder: string
  searchItem: string
  setsearchItem: (value: string) => void
}

const AppSearch = ({
  placeholder,
  searchItem,
  setsearchItem,
}: AppSearchProps) => {
  return (
    <div className="max-w-sm h-11 text-base">
      <Input
        placeholder={placeholder}
        value={searchItem}
        onChange={e => {
          setsearchItem(e.target.value)
        }}
      />
    </div>
  )
}

export default AppSearch
