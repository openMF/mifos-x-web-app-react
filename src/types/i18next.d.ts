import type commonEn from '../locales/en-US/common.json'
import type authEn from '../locales/en-US/auth.json'
import type accountingEn from '../locales/en-US/accounting.json'
import type clientsEn from '../locales/en-US/clients.json'
import type centersEn from '../locales/en-US/centers.json'
import type groupsEn from '../locales/en-US/groups.json'
import type organizationEn from '../locales/en-US/organization.json'
import type productsEn from '../locales/en-US/products.json'
import type loansEn from '../locales/en-US/loans.json'

declare module 'i18next' {
  interface CustomTypeOptions {
    defaultNS: 'common'
    resources: {
      common: typeof commonEn
      auth: typeof authEn
      accounting: typeof accountingEn
      clients: typeof clientsEn
      centers: typeof centersEn
      groups: typeof groupsEn
      organization: typeof organizationEn
      products: typeof productsEn
      loans: typeof loansEn
    }
  }
}
