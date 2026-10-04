/**
 * Copyright since 2025 Mifos Initiative
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

// Applied to a navbar trigger when the current page belongs to its section
export const navActiveClassName =
  'bg-[#0b5c93] hover:bg-[#0b5c93] shadow-[inset_0_-2px_0_0_#ffffff]'

// True when pathname is the given path or a page nested under it
export const isPathActive = (pathname: string, path: string) =>
  pathname === `/${path}` || pathname.startsWith(`/${path}/`)

// Returns the most specific path that matches, so /reports/client picks
// 'reports/client' over 'reports'
export const findActivePath = (pathname: string, paths: string[]) =>
  paths
    .filter(path => isPathActive(pathname, path))
    .sort((a, b) => b.length - a.length)[0]
