import i18next from 'i18next'
import { initReactI18next } from 'react-i18next'
import LanguageDetector from 'i18next-browser-languagedetector'
import resourcesToBackend from 'i18next-resources-to-backend'

i18next
  .use(LanguageDetector)
  .use(
    resourcesToBackend(
      (language: string, namespace: string) =>
        import(`../locales/${language}/${namespace}.json`)
    )
  )
  .use(initReactI18next)
  .init({
    fallbackLng: 'en-US',
    supportedLngs: ['en-US', 'es-ES', 'fr-FR', 'it-IT'],
    ns: [
      'common',
      'auth',
      'accounting',
      'clients',
      'centers',
      'groups',
      'organization',
      'products',
      'loans',
    ],
    defaultNS: 'common',
    load: 'currentOnly',
    interpolation: { escapeValue: false },
    detection: {
      order: ['localStorage', 'navigator', 'htmlTag'],
      lookupLocalStorage: 'mifosLanguage',
    },
  })

i18next.on('languageChanged', lng => {
  document.documentElement.lang = lng
  document.documentElement.dir = 'ltr'
})
