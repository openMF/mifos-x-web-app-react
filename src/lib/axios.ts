/**
 * Copyright since 2025 Mifos Initiative
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */
import axios from 'axios'

const getBaseURL = () => {
  const server = localStorage.getItem('mifosServer') || 'https://localhost:8443'
  return `${server}/fineract-provider/api/v1`
}

const fineract = axios.create({
  baseURL: getBaseURL(),
  headers: {
    'Content-Type': 'application/json',
    Accept: 'application/json',
  },
  withCredentials: true,
})

fineract.interceptors.request.use(config => {
  const token = localStorage.getItem('mifosToken')
  const tenant = localStorage.getItem('mifosTenant') || 'default'
  const server = localStorage.getItem('mifosServer') || 'https://localhost:8443'
  
  // Update baseURL dynamically in case it changed
  config.baseURL = `${server}/fineract-provider/api/v1`
  
  if (token) {
    config.headers['Authorization'] = `Basic ${token}`
    config.headers['Fineract-Platform-TenantId'] = tenant
  }
  return config
})

export default fineract
