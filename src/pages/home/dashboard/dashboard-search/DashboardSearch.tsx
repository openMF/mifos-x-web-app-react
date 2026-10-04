import { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Search, Loader2, User } from 'lucide-react'
import { ClientSearchV2Api } from '@/fineract-api'
import type { ClientSearchData } from '@/fineract-api'
import { getConfiguration } from '@/lib/fineract-openapi'

const searchApi = new ClientSearchV2Api(getConfiguration())

export default function DashboardSearch() {
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<ClientSearchData[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [isOpen, setIsOpen] = useState(false)
  const [selectedIndex, setSelectedIndex] = useState(-1)
  const navigate = useNavigate()
  const wrapperRef = useRef<HTMLDivElement>(null)
  const { t } = useTranslation(['common'])

  useEffect(() => {
    if (!query.trim()) {
      setResults([])
      setIsOpen(false)
      setSelectedIndex(-1)
      setError(null)
      setIsLoading(false)
      return
    }

    let cancelled = false

    const timer = setTimeout(async () => {
      setIsLoading(true)
      setIsOpen(true)
      setError(null)
      try {
        const res = await searchApi.searchByText({
          request: { text: query },
        })
        if (cancelled) return
        const data = res.data?.content || []
        setResults(data)
        setSelectedIndex(-1)
      } catch (err) {
        if (cancelled) return
        console.error('Failed to execute client search', err)
        setError(t('common:dashboard.search.error'))
        setResults([])
      } finally {
        if (!cancelled) setIsLoading(false)
      }
    }, 250)

    return () => {
      cancelled = true
      clearTimeout(timer)
    }
  }, [query, t])

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        wrapperRef.current &&
        !wrapperRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Escape') {
      setIsOpen(false)
      return
    }

    if (!isOpen || results.length === 0) return

    if (e.key === 'ArrowDown') {
      e.preventDefault()
      setSelectedIndex(prev => (prev < results.length - 1 ? prev + 1 : prev))
    } else if (e.key === 'ArrowUp') {
      e.preventDefault()
      setSelectedIndex(prev => (prev > 0 ? prev - 1 : 0))
    } else if (e.key === 'Enter' && selectedIndex >= 0) {
      e.preventDefault()
      const selectedClient = results[selectedIndex]
      if (selectedClient?.id) {
        setIsOpen(false)
        navigate(`/clients/${selectedClient.id}/general`)
      }
    }
  }

  const handleSelectClient = (clientId?: number) => {
    if (!clientId) return
    setIsOpen(false)
    navigate(`/clients/${clientId}/general`)
  }

  return (
    <div
      ref={wrapperRef}
      className="w-full max-w-md flex flex-col gap-1 flex-1 relative z-40"
    >
      <Label htmlFor="dashboard-search">
        {t('common:dashboard.search.label')}
      </Label>
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          id="dashboard-search"
          placeholder={t('common:dashboard.search.placeholder')}
          className="pl-9"
          value={query}
          onChange={e => setQuery(e.target.value)}
          onFocus={() => {
            if (query.trim() && (results.length > 0 || error)) setIsOpen(true)
          }}
          onKeyDown={handleKeyDown}
          autoComplete="off"
          role="combobox"
          aria-expanded={isOpen}
          aria-controls="client-search-results"
          aria-activedescendant={
            selectedIndex >= 0 ? `client-option-${selectedIndex}` : undefined
          }
        />
      </div>

      {(isOpen || isLoading) && query.trim() && (
        <div className="absolute top-full left-0 mt-1.5 w-full bg-white dark:bg-zinc-900 border border-gray-200 dark:border-zinc-800 rounded-md shadow-lg overflow-hidden flex flex-col max-h-[300px]">
          {isLoading ? (
            <div
              className="flex items-center justify-center p-4 text-muted-foreground"
              aria-live="polite"
            >
              <Loader2 className="h-5 w-5 animate-spin mr-2" />
              <span className="text-sm">
                {t('common:dashboard.search.searching')}
              </span>
            </div>
          ) : error ? (
            <div className="p-4 text-center text-sm text-red-500" role="alert">
              {error}
            </div>
          ) : results.length > 0 ? (
            <ul
              id="client-search-results"
              className="overflow-y-auto"
              role="listbox"
              aria-label={t('common:dashboard.search.resultsLabel')}
            >
              {results.map((client, index) => (
                <li
                  key={client.id}
                  id={`client-option-${index}`}
                  role="option"
                  aria-selected={selectedIndex === index}
                  onClick={() => handleSelectClient(client.id)}
                  onMouseEnter={() => setSelectedIndex(index)}
                  className={`flex items-center gap-3 px-4 py-3 cursor-pointer transition-colors border-b border-gray-100 dark:border-zinc-800 last:border-0
                    ${selectedIndex === index ? 'bg-gray-100 dark:bg-zinc-800' : 'hover:bg-gray-50 dark:hover:bg-zinc-800/50'}
                  `}
                >
                  <div className="bg-blue-100 dark:bg-blue-900/40 p-2 rounded-full">
                    <User className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                  </div>
                  <div className="flex flex-col">
                    <span className="font-medium text-sm text-gray-900 dark:text-gray-100">
                      {client.displayName ||
                        t('common:dashboard.search.unnamedClient')}
                    </span>
                    <span className="text-xs text-muted-foreground">
                      ID: {client.id}{' '}
                      {client.accountNumber
                        ? `• Acc: ${client.accountNumber}`
                        : ''}
                    </span>
                  </div>
                </li>
              ))}
            </ul>
          ) : (
            <div
              className="p-4 text-center text-sm text-muted-foreground"
              role="status"
            >
              {t('common:dashboard.search.noResults', { query })}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
