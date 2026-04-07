import { useTranslation } from 'react-i18next'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'

interface SupportedLanguage {
  code: string
  label: string
}

const SUPPORTED_LANGUAGES: SupportedLanguage[] = [
  { code: 'en-US', label: 'English' },
  { code: 'es-ES', label: 'Español' },
  { code: 'fr-FR', label: 'Français' },
  { code: 'it-IT', label: 'Italiano' },
] as const

interface LanguageSwitcherProps {
  className?: string
}

export function LanguageSwitcher({ className }: LanguageSwitcherProps) {
  const { i18n, t } = useTranslation('common')

  const handleChange = (value: string) => {
    void i18n.changeLanguage(value)
  }

  return (
    <Select value={i18n.language} onValueChange={handleChange}>
      <SelectTrigger className={className} aria-label={t('fields.language')}>
        <SelectValue placeholder={t('fields.language')} />
      </SelectTrigger>
      <SelectContent>
        {SUPPORTED_LANGUAGES.map(lang => (
          <SelectItem key={lang.code} value={lang.code}>
            {lang.label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  )
}
