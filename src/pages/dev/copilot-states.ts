/**
 * Copyright since 2025 Mifos Initiative
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

import { initialThread, type CopilotThread } from '@/lib/copilot'
import {
  approved,
  confirmationExpired,
  loanSummary,
  modelRefused,
  notConfirmed,
  overdueNotAvailable,
  rateLimited,
  rejected,
  repaymentSchedule,
  replay,
  sessionExpired,
  writeCard,
  type RecordedFrame,
} from '@/lib/copilot/recordings'

/** Every question below was asked at the same moment, so times match. */
const ASKED_AT = new Date(2026, 10, 20, 9, 41).getTime()

const LOAN = 'Summarise loan 000004521'
const REPAY = 'Record a repayment of 1,500 on loan 000004521'

/** How many frames to play to reach the first one that matches. */
function until(
  frames: RecordedFrame[],
  match: (frame: RecordedFrame) => boolean,
  extra = 0
): number {
  return frames.findIndex(match) + extra
}

const summary = loanSummary()
const card = writeCard('repayment', 'card-1', new Date(ASKED_AT))

export interface CopilotState {
  id: string
  title: string
  /** What to look for in this state. */
  note: string
  thread: CopilotThread
}

/**
 * The states, in the order a turn passes through them. Each is a replay of
 * recorded gateway frames through the real translator and reducer, so what
 * is shown here is what the panel shows for the same reply.
 */
export const COPILOT_STATES: CopilotState[] = [
  {
    id: 'welcome',
    title: 'Empty conversation',
    note: 'Greeting and starter questions.',
    thread: initialThread,
  },
  {
    id: 'waiting',
    title: 'Waiting for the first word',
    note: 'Sent, and nothing has arrived yet.',
    thread: replay([{ ask: LOAN, frames: summary }], {
      last: 0,
      sentAt: ASKED_AT,
    }),
  },
  {
    id: 'notes',
    title: 'Working notes arriving',
    note: 'The model thinks before it answers; notes stay apart from the answer.',
    thread: replay([{ ask: LOAN, frames: summary }], {
      last: 10,
      sentAt: ASKED_AT,
    }),
  },
  {
    id: 'step',
    title: 'Reading the record',
    note: 'A tool step in progress, named by the gateway.',
    thread: replay([{ ask: LOAN, frames: summary }], {
      last: until(summary, f => f.data.phase === 'started', 1),
      sentAt: ASKED_AT,
    }),
  },
  {
    id: 'streaming',
    title: 'Answer arriving',
    note: 'Words fade in behind a caret.',
    thread: replay([{ ask: LOAN, frames: summary }], {
      last: until(summary, f => f.event === 'token', 14),
      sentAt: ASKED_AT,
    }),
  },
  {
    id: 'answer',
    title: 'Answer with follow-ups',
    note: 'Steps taken, the answer, and the follow-ups the model proposed.',
    thread: replay([{ ask: LOAN, frames: summary }], { sentAt: ASKED_AT }),
  },
  {
    id: 'table',
    title: 'Formatted answer',
    note: 'A table, as the model writes it in markdown.',
    thread: replay(
      [{ ask: 'Show the repayment schedule', frames: repaymentSchedule() }],
      { sentAt: ASKED_AT }
    ),
  },
  {
    id: 'no-tool',
    title: 'A question no tool answers',
    note: 'The gateway cannot search by arrears, so the answer says so.',
    thread: replay(
      [
        {
          ask: 'Which loans are overdue this week?',
          frames: overdueNotAvailable(),
        },
      ],
      { sentAt: ASKED_AT }
    ),
  },
  {
    id: 'approval',
    title: 'Waiting for a confirmation',
    note: 'A write paused for the officer. Confirming from the panel comes later.',
    thread: replay([{ ask: REPAY, frames: card }], { sentAt: ASKED_AT }),
  },
  {
    id: 'approved',
    title: 'Confirmed and recorded',
    note: 'The gateway’s outcome line, its receipt card, then the summary.',
    thread: replay(
      [
        { ask: REPAY, frames: card },
        { decide: 'approve', frames: approved('repayment') },
      ],
      { sentAt: ASKED_AT }
    ),
  },
  {
    id: 'rejected',
    title: 'Rejected',
    note: 'Nothing ran.',
    thread: replay(
      [
        { ask: REPAY, frames: card },
        { decide: 'reject', frames: rejected() },
      ],
      { sentAt: ASKED_AT }
    ),
  },
  {
    id: 'not-confirmed',
    title: 'Sent, outcome unknown',
    note: 'The banking system did not answer; the officer must check the account.',
    thread: replay(
      [
        { ask: REPAY, frames: card },
        { decide: 'approve', frames: notConfirmed('repayment') },
      ],
      { sentAt: ASKED_AT }
    ),
  },
  {
    id: 'expired',
    title: 'Confirmation no longer valid',
    note: 'Decided after the card expired, or twice.',
    thread: replay(
      [
        { ask: REPAY, frames: card },
        { decide: 'approve', frames: confirmationExpired() },
      ],
      { sentAt: ASKED_AT }
    ),
  },
  {
    id: 'rate-limited',
    title: 'Busy, try again',
    note: 'A retryable error offers to ask again.',
    thread: replay([{ ask: LOAN, frames: rateLimited() }], {
      sentAt: ASKED_AT,
    }),
  },
  {
    id: 'refused',
    title: 'Model refused',
    note: 'Not retryable: no button, because waiting will not help.',
    thread: replay([{ ask: LOAN, frames: modelRefused() }], {
      sentAt: ASKED_AT,
    }),
  },
  {
    id: 'session-expired',
    title: 'Session expired',
    note: 'Fineract refused the credential during a step.',
    thread: replay([{ ask: LOAN, frames: sessionExpired() }], {
      sentAt: ASKED_AT,
    }),
  },
  {
    id: 'cut-off',
    title: 'Answer cut off',
    note: 'The stream closed before the gateway said it was done.',
    thread: replay(
      [
        {
          ask: LOAN,
          frames: summary.slice(
            0,
            until(summary, f => f.event === 'token', 20)
          ),
        },
      ],
      { last: 'cut', sentAt: ASKED_AT }
    ),
  },
]
