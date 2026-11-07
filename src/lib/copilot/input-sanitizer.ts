/**
 * Copyright since 2025 Mifos Initiative
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

/** The gateway refuses longer messages, so the panel stops them first. */
export const MAX_INPUT_LENGTH = 500

export type SanitizeResult =
  | { blocked: false; text: string }
  | { blocked: true; reason: 'invalid_length' | 'injection_detected' }

/**
 * Known prompt-injection phrasings, kept narrow so real banking questions are
 * never blocked. This is a first filter, not the defence: the gateway allows
 * only a fixed list of tools, and Fineract's permissions decide what runs.
 */
const INJECTION_PATTERNS: RegExp[] = [
  /ignore\s+(?:all\s+|any\s+|the\s+)?(?:previous\s+|prior\s+|above\s+|earlier\s+)?(?:instructions?|prompts?|rules?|context|directives?)/i,
  /disregard\s+(?:all\s+|the\s+)?(?:previous|prior|above)\b/i,
  /forget\s+(?:all\s+(?:your\s+)?|everything\s+)?(?:previous|prior|instructions?)/i,
  /you\s+are\s+now\s+(?:a|an|in|free|dan|developer)\b/i,
  /act\s+as\s+(?:an?\s+)?(?:ai|assistant|admin|administrator|system|developer|dan|jailbroken)\b/i,
  /pretend\s+(?:to\s+be|you(?:'re|\s+are))/i,
  /(?:system|developer)\s+prompt/i,
  /(?:reveal|show|print|repeat)\s+(?:your|the)\s+(?:system\s+)?(?:prompt|instructions)/i,
  /override\s+(?:your\s+|the\s+)?(?:instructions|rules|system)/i,
  /prompt\s+injection/i,
  /developer\s+mode/i,
  /jailbreak/i,
]

/** Remove markup and invisible or control characters, then tidy spaces. */
export function stripDangerous(input: string): string {
  return (input ?? '')
    .replace(/<(script|style)\b[^>]*>[\s\S]*?<\/\1>/gi, '')
    .replace(/<\/?[a-zA-Z][^>]*>/g, '')
    .replace(/\p{Cf}/gu, '')
    .replace(/\p{Cc}/gu, ' ')
    .replace(/\s+/g, ' ')
    .trim()
}

/** Clean, then check length, then check for injection phrasing. */
export function sanitizeInput(
  input: string,
  maxLength: number = MAX_INPUT_LENGTH
): SanitizeResult {
  const text = stripDangerous(input)
  if (!text || text.length > maxLength) {
    return { blocked: true, reason: 'invalid_length' }
  }
  if (INJECTION_PATTERNS.some(pattern => pattern.test(text))) {
    return { blocked: true, reason: 'injection_detected' }
  }
  return { blocked: false, text }
}
