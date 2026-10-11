/**
 * Copyright since 2025 Mifos Initiative
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */
import { AppBreadCrumbs } from '@/components/custom/breadcrumbs/AppBreadCrumbs'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'

const PasswordPreferences = () => {
  return (
    <div className="min-h-screen px-6 py-10 max-w-7xl mx-auto text-[15px]">
      <AppBreadCrumbs
        items={[
          { label: 'Home', href: '/home' },
          { label: 'Organization', href: '/organization' },
          { label: 'Password Preferences', current: true },
        ]}
      />

      <div className="bg-white dark:bg-zinc-900 rounded-md border p-8 shadow mt-6">
        <div className="flex flex-col gap-1 mb-6">
          <h2 className="text-2xl font-semibold">Password Preferences</h2>
          <p className="text-sm text-zinc-600 dark:text-zinc-300">
            Define password strength and account lockout rules.
          </p>
        </div>

        <form className="space-y-8" onSubmit={event => event.preventDefault()}>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium" htmlFor="min-length">
                Minimum Length
              </label>
              <Input id="min-length" type="number" placeholder="e.g. 8" />
            </div>
            <div className="space-y-2">
              <label
                className="text-sm font-medium"
                htmlFor="max-failed-attempts"
              >
                Max Failed Attempts
              </label>
              <Input
                id="max-failed-attempts"
                type="number"
                placeholder="e.g. 5"
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium" htmlFor="lockout-duration">
                Lockout Duration (mins)
              </label>
              <Input
                id="lockout-duration"
                type="number"
                placeholder="e.g. 30"
              />
            </div>
          </div>

          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Complexity Requirements</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div className="flex items-center gap-2">
                <Checkbox id="require-uppercase" />
                <label htmlFor="require-uppercase">
                  Require uppercase letter
                </label>
              </div>
              <div className="flex items-center gap-2">
                <Checkbox id="require-lowercase" />
                <label htmlFor="require-lowercase">
                  Require lowercase letter
                </label>
              </div>
              <div className="flex items-center gap-2">
                <Checkbox id="require-number" />
                <label htmlFor="require-number">Require number</label>
              </div>
              <div className="flex items-center gap-2">
                <Checkbox id="require-special-character" />
                <label htmlFor="require-special-character">
                  Require special character
                </label>
              </div>
            </div>
          </div>

          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Session Policies</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <label
                  className="text-sm font-medium"
                  htmlFor="password-expiry"
                >
                  Password Expiry (days)
                </label>
                <Input
                  id="password-expiry"
                  type="number"
                  placeholder="e.g. 90"
                />
              </div>
              <div className="space-y-2">
                <label
                  className="text-sm font-medium"
                  htmlFor="password-history-count"
                >
                  Password History Count
                </label>
                <Input
                  id="password-history-count"
                  type="number"
                  placeholder="e.g. 5"
                />
              </div>
            </div>
          </div>

          <div className="flex justify-end gap-3">
            <Button variant="outline" type="button">
              Cancel
            </Button>
            <Button type="submit">Save Changes</Button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default PasswordPreferences
