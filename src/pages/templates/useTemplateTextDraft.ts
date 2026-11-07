/**
 * Copyright since 2025 Mifos Initiative
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */
import { useCallback, useState } from 'react'

import {
  convertTemplateText,
  detectTemplateTextFormat,
  type TemplateTextFormat,
} from './templateText'

/**
 * Holds the template body while it is being edited, in both formats at once.
 *
 * Converting on every switch is lossy in one direction or the other — HTML
 * carries styling that plain text has no way to express. So the draft keeps
 * the source it was given for each format and only reconverts when that source
 * has actually gone stale, which makes HTML → plain → HTML return the original
 * markup rather than a flattened copy of it.
 */
interface TemplateTextDraftState {
  format: TemplateTextFormat
  /** The body as last authored in each format. */
  sources: Record<TemplateTextFormat, string>
  /**
   * Whether the format that is *not* current still matches what is on screen.
   * Cleared by every edit, restored by the conversion a switch performs.
   */
  counterpartIsCurrent: boolean
}

export interface TemplateTextDraft {
  format: TemplateTextFormat
  text: string
  setText: (text: string) => void
  setFormat: (format: TemplateTextFormat) => void
  /** Replaces the body outright, as when loading a template or clearing it. */
  reset: (text: string) => void
}

const initialState = (text: string): TemplateTextDraftState => {
  const format = detectTemplateTextFormat(text)
  return {
    format,
    sources: { html: '', plain: '', [format]: text },
    counterpartIsCurrent: false,
  }
}

export const useTemplateTextDraft = (initialText = ''): TemplateTextDraft => {
  const [state, setState] = useState<TemplateTextDraftState>(() =>
    initialState(initialText)
  )

  const setText = useCallback((text: string) => {
    setState(current => ({
      ...current,
      sources: { ...current.sources, [current.format]: text },
      // The other format now describes an older body, so a switch has to
      // reconvert rather than restore.
      counterpartIsCurrent: false,
    }))
  }, [])

  const setFormat = useCallback((format: TemplateTextFormat) => {
    setState(current => {
      if (format === current.format) return current

      if (current.counterpartIsCurrent) {
        // Nothing was edited since the last switch: the stored source for the
        // target format is still exactly what produced what is on screen.
        return { ...current, format }
      }

      const converted = convertTemplateText(
        current.sources[current.format],
        current.format,
        format
      )
      return {
        format,
        sources: { ...current.sources, [format]: converted },
        counterpartIsCurrent: true,
      }
    })
  }, [])

  const reset = useCallback((text: string) => {
    setState(initialState(text))
  }, [])

  return {
    format: state.format,
    text: state.sources[state.format],
    setText,
    setFormat,
    reset,
  }
}
