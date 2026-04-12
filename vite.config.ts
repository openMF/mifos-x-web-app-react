/**
 * Copyright since 2025 Mifos Initiative
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */
import path from 'path'
import tailwindcss from '@tailwindcss/vite'
import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')

  // Fineract backend URL for the Vite dev proxy
  // Default: Fineract Docker container exposes 8443 on host port 3000
  const fineractUrl = env.VITE_FINERACT_API_URL || 'https://localhost:3000'

  return {
    plugins: [react(), tailwindcss()],
    resolve: {
      alias: {
        '@': path.resolve(__dirname, './src'),
      },
    },
    server: {
      proxy: {
        // Proxy all /fineract-provider/* requests to the Fineract backend
        '/fineract-provider': {
          target: fineractUrl,
          changeOrigin: true,
          secure: false, // allow self-signed certs
        },
      },
    },
  }
})
