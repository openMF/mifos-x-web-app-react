/**
 * Copyright since 2025 Mifos Initiative
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */
import { execSync } from 'child_process'
import path from 'path'
import tailwindcss from '@tailwindcss/vite'
import { loadEnv } from 'vite'
import react from '@vitejs/plugin-react'
import { defineConfig } from 'vitest/config'
import { version } from './package.json'

// Short commit hash of the build, shown on System Information. Empty when the
// build runs without git, as in the Docker image.
const gitHash = () => {
  try {
    return execSync('git rev-parse --short HEAD', {
      stdio: ['ignore', 'pipe', 'ignore'],
    })
      .toString()
      .trim()
  } catch {
    return ''
  }
}

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')

  // Fineract backend URL for the Vite dev proxy
  // Default: Fineract Docker container exposes 8443 on host port 3000
  const fineractUrl = env.VITE_FINERACT_API_URL || 'https://localhost:3000'

  return {
    plugins: [react(), tailwindcss()],
    define: {
      __APP_VERSION__: JSON.stringify(version),
      __APP_HASH__: JSON.stringify(gitHash()),
    },
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
          // Fineract answers a refused credential or two-factor token with
          // "WWW-Authenticate: Basic", which makes the browser open its own
          // sign-in prompt over the app. The app handles the 401 itself.
          configure: proxy => {
            proxy.on('proxyRes', response => {
              delete response.headers['www-authenticate']
            })
          },
        },
      },
    },
    test: {
      globals: true,
      projects: [
        {
          extends: true,
          test: {
            name: 'unit',
            environment: 'node',
            include: ['src/**/*.test.ts'],
          },
        },
        {
          // Components, rendered into a simulated browser page.
          extends: true,
          test: {
            name: 'dom',
            environment: 'jsdom',
            include: ['src/**/*.test.tsx'],
            setupFiles: ['src/test/setup-dom.ts'],
          },
        },
      ],
      coverage: {
        provider: 'v8',
        // `json-summary` feeds the coverage table in the CI job summary.
        reporter: ['text', 'lcov', 'json-summary'],
        include: ['src/lib/**'],
      },
    },
  }
})
