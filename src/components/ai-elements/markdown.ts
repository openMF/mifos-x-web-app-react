/**
 * Copyright since 2025 Mifos Initiative
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

import { cjk } from '@streamdown/cjk'
import { code } from '@streamdown/code'
import { math } from '@streamdown/math'
import { mermaid } from '@streamdown/mermaid'
import { harden } from 'rehype-harden'
import { defaultRehypePlugins, type StreamdownProps } from 'streamdown'

/** Markdown settings shared by message answers and reasoning. */
export const streamdownPlugins = { cjk, code, math, mermaid }

/**
 * Upstream's sanitising steps, with a strict last step. Answers are written
 * by a model that reads client data, so a prompt-injected answer must not be
 * able to send that data out: no remote images (an image URL is fetched the
 * moment it renders), and links only to https or mailto.
 */
export const safeRehypePlugins = [
  defaultRehypePlugins.raw,
  defaultRehypePlugins.sanitize,
  [
    harden,
    {
      allowedImagePrefixes: [],
      allowDataImages: true,
      allowedLinkPrefixes: ['*'],
      allowedProtocols: ['https', 'mailto'],
    },
  ],
] satisfies StreamdownProps['rehypePlugins']
