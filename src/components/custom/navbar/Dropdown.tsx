/**
 * Copyright since 2025 Mifos Initiative
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSub,
  DropdownMenuSubTrigger,
  DropdownMenuSubContent,
} from '@/components/ui/dropdown-menu'
import { useNavigate } from 'react-router-dom'
import { cn } from '@/lib/utils'
import { navActiveClassName } from '@/components/custom/navbar/nav-active'

interface DropdownOption {
  label: string
  path?: string
  disabled?: boolean
  onClick?: () => void
  children?: DropdownOption[]
}

interface DropdownProps {
  name: React.ReactNode
  options: DropdownOption[]
  onSelect?: (path?: string) => void
  // Highlights the trigger, e.g. when the current page belongs to this menu
  active?: boolean
  // Path of the option that matches the current page
  activePath?: string
}

const itemClassName =
  'cursor-pointer px-4 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-100'
const activeItemClassName = 'bg-gray-100 text-[#1074b9]'

const Dropdown = ({
  name,
  options,
  onSelect,
  active = false,
  activePath,
}: DropdownProps) => {
  const navigate = useNavigate()

  const handleSelect = (path?: string) => {
    if (onSelect) {
      onSelect(path)
    } else if (path) {
      navigate(`/${path}`)
    }
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          className={cn(
            'flex items-center gap-2 px-4 py-2 text-base font-medium text-white bg-[#1074b9] hover:bg-[#0e6aa5] hover:text-white rounded-md transition duration-150',
            active && navActiveClassName
          )}
          variant="ghost"
        >
          {name}
        </Button>
      </DropdownMenuTrigger>

      <DropdownMenuContent
        className="w-44 mt-2 rounded-md border border-gray-200 bg-white"
        align="start"
      >
        {options.map((option, index) =>
          option.children ? (
            <DropdownMenuSub key={index}>
              <DropdownMenuSubTrigger className="px-4 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-100">
                {option.label}
              </DropdownMenuSubTrigger>
              <DropdownMenuSubContent className="bg-white border">
                {option.children.map((child, i) => (
                  <DropdownMenuItem
                    key={i}
                    onClick={() => handleSelect(child.path)}
                    disabled={child.disabled}
                    aria-current={
                      child.path && child.path === activePath
                        ? 'page'
                        : undefined
                    }
                    className={cn(
                      itemClassName,
                      child.path &&
                        child.path === activePath &&
                        activeItemClassName
                    )}
                  >
                    {child.label}
                  </DropdownMenuItem>
                ))}
              </DropdownMenuSubContent>
            </DropdownMenuSub>
          ) : (
            <DropdownMenuItem
              key={index}
              onClick={() => handleSelect(option.path)}
              disabled={option.disabled}
              aria-current={
                option.path && option.path === activePath ? 'page' : undefined
              }
              className={cn(
                itemClassName,
                option.path && option.path === activePath && activeItemClassName
              )}
            >
              {option.label}
            </DropdownMenuItem>
          )
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

export default Dropdown
