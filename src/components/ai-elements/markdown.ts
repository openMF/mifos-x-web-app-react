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

/** The only link targets an answer may carry. */
const LINK_PROTOCOLS = ['https:', 'mailto:']

interface HastNode {
  type: string
  tagName?: string
  properties?: Record<string, unknown>
  children?: HastNode[]
}

/**
 * The last word on links. `harden` always lets http, irc, xmpp and blob
 * links through, so this step removes the target of any link that is not
 * https or mailto. The link text stays; it just goes nowhere.
 */
function linkProtocols() {
  const visit = (node: HastNode) => {
    if (node.type === 'element' && node.tagName === 'a' && node.properties) {
      const href = node.properties.href
      const allowed =
        typeof href === 'string' &&
        LINK_PROTOCOLS.some(protocol =>
          href.trim().toLowerCase().startsWith(protocol)
        )
      if (!allowed) delete node.properties.href
    }
    node.children?.forEach(visit)
  }
  return (tree: HastNode) => visit(tree)
}

/**
 * The default sanitising steps, then two strict ones. Answers are written
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
    },
  ],
  linkProtocols,
] satisfies StreamdownProps['rehypePlugins']
