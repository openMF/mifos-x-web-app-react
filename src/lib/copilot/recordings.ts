/**
 * Copyright since 2025 Mifos Initiative
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

import type { CopilotEvent } from './events'
import { copilotReducer, initialThread, type CopilotThread } from './reducer'
import type { Decision } from './transport'
import { V1EventMapper } from './v1-protocol'

/**
 * Gateway replies, written down frame by frame.
 *
 * Every frame here is one the gateway in openMF/mcp-mifosx actually sends:
 * the tool names and step labels come from its `tools.yaml`, the card rows
 * and receipts from `AgentLoop`, and the error wording from its own
 * messages. Mock mode streams these, and the states page replays them, so
 * neither can show something a real gateway cannot do. When the gateway
 * changes what it sends, change it here.
 *
 * Two things the gateway does that are easy to forget:
 * - follow-up questions arrive inside the answer, as a fenced `suggest`
 *   block the model writes; the `suggest` event is never sent;
 * - reads come back as the model's own prose. Only writes bring cards.
 */
export interface RecordedFrame {
  event: string
  data: Record<string, unknown>
}

export const CONVERSATION_ID = 'mock-conversation'

const CLIENT = 'Rajesh Kumar'
const LOAN_ACCOUNT = '000004521'
const PRODUCT = 'Small Business Loan'

/** The model's working notes, opened and closed the way the gateway does. */
function thinking(text: string, elapsedMs: number): RecordedFrame[] {
  return [
    { event: 'thinking', data: { phase: 'start' } },
    ...words(text).map(delta => ({
      event: 'thinking',
      data: { phase: 'delta', delta },
    })),
    { event: 'thinking', data: { phase: 'end', elapsed_ms: elapsedMs } },
  ]
}

/** One tool run: started, then finished, labelled from the manifest. */
function step(
  tool: string,
  label: { running: string; done: string },
  durationMs: number,
  readOnly = true
): RecordedFrame[] {
  return [
    {
      event: 'tool_call',
      data: {
        tool,
        label: label.running,
        phase: 'started',
        read_only: readOnly,
      },
    },
    {
      event: 'tool_call',
      data: {
        tool,
        label: label.done,
        phase: 'finished',
        read_only: readOnly,
        duration_ms: durationMs,
      },
    },
  ]
}

/** Answer text, word by word, the way a model streams it. */
function tokens(text: string): RecordedFrame[] {
  return words(text).map(delta => ({ event: 'token', data: { delta } }))
}

/** Follow-ups as the model writes them: a fenced block inside the answer. */
const suggest = (...items: string[]) =>
  `\n\n\`\`\`suggest\n${items.join('\n')}\n\`\`\``

const done = (conversationId = CONVERSATION_ID): RecordedFrame => ({
  event: 'done',
  data: { conversation_id: conversationId },
})

function error(
  code: string,
  message: string,
  retryable: boolean,
  conversationId = CONVERSATION_ID
): RecordedFrame[] {
  return [
    { event: 'error', data: { code, message, retryable } },
    done(conversationId),
  ]
}

/** "20 November 2026", as the gateway writes dates on cards. */
function longDate(date: Date): string {
  return new Intl.DateTimeFormat('en-GB', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  }).format(date)
}

const isoDate = (date: Date) => date.toISOString().slice(0, 10)

/** A read: the loan account, summed up in the model's words. */
export function loanSummary(): RecordedFrame[] {
  return [
    ...thinking(
      `The officer is asking about loan account ${LOAN_ACCOUNT}. I should read the loan account before answering.`,
      1200
    ),
    ...step(
      'mifos_loan_details',
      { running: 'Reading the loan account', done: 'Read the loan account' },
      420
    ),
    ...tokens(
      `Loan account **${LOAN_ACCOUNT}** (${PRODUCT}) for ${CLIENT} is ` +
        'active. The outstanding balance is INR 42,000.00 and the next ' +
        'instalment of INR 3,500.00 is due on 5 December 2026. No ' +
        'instalments are overdue.' +
        suggest('Show the repayment schedule', 'Record a repayment')
    ),
    done(),
  ]
}

/** A read the model chose to write as a table. */
export function repaymentSchedule(): RecordedFrame[] {
  return [
    ...step(
      'mifos_loan_schedule',
      {
        running: 'Fetching the repayment schedule',
        done: 'Fetched the repayment schedule',
      },
      640
    ),
    ...tokens(
      `### Repayment schedule, loan account ${LOAN_ACCOUNT}\n\n` +
        `**${CLIENT}** has 12 instalments of INR 3,500.00; ` +
        '**4 are paid** and none are overdue.\n\n' +
        '| # | Due date | Principal | Interest | Status |\n' +
        '| ---: | --- | ---: | ---: | --- |\n' +
        '| 4 | 5 November 2026 | INR 3,080.00 | INR 420.00 | Paid |\n' +
        '| 5 | 5 December 2026 | INR 3,111.00 | INR 389.00 | Due |\n' +
        '| 6 | 5 January 2027 | INR 3,142.00 | INR 358.00 | Upcoming |\n' +
        '| 7 | 5 February 2027 | INR 3,173.00 | INR 327.00 | Upcoming |\n\n' +
        'The loan is due to close on 5 August 2027.' +
        suggest('Record a repayment', 'Check their other accounts')
    ),
    done(),
  ]
}

/**
 * A question no tool can answer. The gateway has no search by arrears, so
 * a live model says so rather than inventing a list; so does the mock.
 */
export function overdueNotAvailable(): RecordedFrame[] {
  return [
    ...thinking(
      'None of my tools searches loans by arrears. I should say so and offer what I can do.',
      800
    ),
    ...tokens(
      "I can't list overdue loans yet: none of the tools I have searches " +
        'loans by arrears. I can read one loan account at a time, ' +
        'including its repayment schedule and anything overdue on it, or ' +
        'find a client and go through their accounts.' +
        suggest('Find a client by name', 'Show the repayment schedule')
    ),
    done(),
  ]
}

/** The writes the mock can pause on, one per gateway write tool it fakes. */
export type MockCommand = 'repayment' | 'approve' | 'disburse'

interface WriteSpec {
  tool: string
  label: { running: string; done: string }
  args: (today: string) => Record<string, unknown>
  rows: (today: string) => Record<string, string>
  summary: string
  thought: string
  result: string
}

/**
 * Rows in the order the gateway builds them: what it read about the
 * account first, then the values the officer is agreeing to.
 */
const WRITES: Record<MockCommand, WriteSpec> = {
  repayment: {
    tool: 'mifos_loan_repayment',
    label: {
      running: 'Preparing the repayment',
      done: 'Prepared the repayment',
    },
    args: today => ({
      loanId: 4521,
      transactionAmount: 1500,
      transactionDate: today,
    }),
    rows: today => ({
      Client: CLIENT,
      'Loan account': LOAN_ACCOUNT,
      Product: PRODUCT,
      Outstanding: 'INR 42,000.00',
      'Repayment amount': 'INR 1,500.00',
      'Transaction date': today,
    }),
    summary: `Record repayment on ${PRODUCT} for ${CLIENT}`,
    thought: `The officer wants to record INR 1,500.00 on loan account ${LOAN_ACCOUNT}. A repayment changes the account, so it needs their confirmation.`,
    result: `The repayment of INR 1,500.00 is recorded. The outstanding balance on loan account ${LOAN_ACCOUNT} is now INR 40,500.00.`,
  },
  approve: {
    tool: 'mifos_loan_approve',
    label: { running: 'Preparing the approval', done: 'Prepared the approval' },
    args: today => ({ loanId: 4521, approvedOnDate: today }),
    rows: today => ({
      Client: CLIENT,
      'Loan account': LOAN_ACCOUNT,
      Product: PRODUCT,
      'Applied for': 'INR 42,000.00',
      'Approval date': today,
    }),
    summary: `Approve ${PRODUCT} for ${CLIENT}`,
    thought: `The officer wants to approve loan account ${LOAN_ACCOUNT}. An approval changes the account, so it needs their confirmation.`,
    result: `Loan account ${LOAN_ACCOUNT} is approved for INR 42,000.00 and is ready to disburse.`,
  },
  disburse: {
    tool: 'mifos_loan_disburse',
    label: {
      running: 'Preparing the disbursement',
      done: 'Prepared the disbursement',
    },
    args: today => ({ loanId: 4521, actualDisbursementDate: today }),
    rows: today => ({
      Client: CLIENT,
      'Loan account': LOAN_ACCOUNT,
      Product: PRODUCT,
      'Approved amount': 'INR 42,000.00',
      'Disbursement date': today,
    }),
    summary: `Disburse ${PRODUCT} for ${CLIENT}`,
    thought: `The officer wants to disburse loan account ${LOAN_ACCOUNT}. Paying out money needs their confirmation.`,
    result: `INR 42,000.00 is disbursed on loan account ${LOAN_ACCOUNT}. The first instalment falls due in a month.`,
  },
}

/**
 * A write, paused for the officer. Ends without 'done': the gateway holds
 * the turn until the decision arrives on the decision endpoint.
 */
export function writeCard(
  command: MockCommand,
  cardId: string,
  now = new Date()
): RecordedFrame[] {
  const spec = WRITES[command]
  return [
    ...thinking(spec.thought, 900),
    {
      event: 'action_card',
      data: {
        card_id: cardId,
        tool: spec.tool,
        args: spec.args(isoDate(now)),
        rows: spec.rows(longDate(now)),
        human_summary: spec.summary,
        idempotency_key: `${cardId}-key`,
        // The gateway's cards last five minutes.
        expires_at: new Date(now.getTime() + 5 * 60_000).toISOString(),
      },
    },
  ]
}

/**
 * Approved and run. The gateway reports the step, sends a receipt card
 * with a link to the record, states the outcome itself, and only then lets
 * the model sum up.
 */
export function approved(command: MockCommand): RecordedFrame[] {
  const spec = WRITES[command]
  return [
    ...step(spec.tool, spec.label, 610, false),
    {
      event: 'action_card',
      data: {
        card: {
          type: 'loan',
          title: 'Loan updated',
          data: {
            Client: CLIENT,
            'Loan account': LOAN_ACCOUNT,
            Product: PRODUCT,
          },
          actions: [
            {
              label: 'Open loan',
              style: 'primary',
              route: '/clients/12/loans-accounts/4521/general',
            },
          ],
        },
      },
    },
    ...tokens(`✔ Executed: ${spec.summary}\n\n${spec.result}`),
    done(),
  ]
}

/** Rejected: nothing ran, and the model says so. */
export function rejected(): RecordedFrame[] {
  return [
    ...tokens(
      `Understood. Nothing was recorded, and loan account ${LOAN_ACCOUNT} is unchanged.`
    ),
    done(),
  ]
}

/**
 * Sent to the banking system, and no answer came back. The gateway will
 * not guess either way, and puts the card back for a safe retry.
 */
export function notConfirmed(command: MockCommand): RecordedFrame[] {
  const spec = WRITES[command]
  return [
    ...step(spec.tool, spec.label, 30_000, false),
    ...tokens(
      `? Not confirmed: ${spec.summary}. The banking system did not answer ` +
        'in time, so this may or may not have gone through. Open the ' +
        'account and check before trying again.'
    ),
    done(),
  ]
}

/** A decision on a card the gateway no longer holds. */
export function confirmationExpired(): RecordedFrame[] {
  return error(
    'PERMISSION_DENIED',
    'This confirmation is no longer valid. Please ask again.',
    false,
    ''
  )
}

/** The model provider throttled the gateway. */
export function rateLimited(): RecordedFrame[] {
  return error(
    'RATE_LIMITED',
    'That was a lot of questions at once. Please wait a moment and try again.',
    true
  )
}

/** The model provider refused the request: waiting will not help. */
export function modelRefused(): RecordedFrame[] {
  return error(
    'LLM_UNAVAILABLE',
    'The AI model rejected this request. Retrying will not help, so please tell your administrator.',
    false
  )
}

/** Fineract refused the officer's credential halfway through a read. */
export function sessionExpired(): RecordedFrame[] {
  return [
    {
      event: 'tool_call',
      data: {
        tool: 'mifos_loan_details',
        label: 'Reading the loan account',
        phase: 'started',
        read_only: true,
      },
    },
    ...error(
      'AUTH_EXPIRED',
      'Your session expired. Please sign in again and retry.',
      true
    ),
  ]
}

/** As Server-Sent Events, the way they travel. */
export function toSse(frame: RecordedFrame): string {
  return `event: ${frame.event}\ndata: ${JSON.stringify(frame.data)}\n\n`
}

function words(text: string): string[] {
  return text.match(/\S+\s*|\s+/g) ?? []
}

/** One officer action, and the gateway's reply to it. */
export type ScriptedTurn =
  | { ask: string; frames: RecordedFrame[] }
  | { decide: Decision; frames: RecordedFrame[] }

export interface ReplayOptions {
  /**
   * How the last reply ends. 'complete' plays it all, 'cut' plays it all and
   * then closes the stream early (the reply never said it was done), and a
   * number stops after that many frames, mid-turn, as if still arriving.
   */
  last?: 'complete' | 'cut' | number
  /** When each question was asked, in epoch ms. */
  sentAt?: number
}

/**
 * A conversation as the panel would hold it after these turns, built by
 * running the frames through the same translator and reducer a live
 * gateway's replies go through. Used by the states page and by tests.
 */
export function replay(
  turns: ScriptedTurn[],
  { last = 'complete', sentAt }: ReplayOptions = {}
): CopilotThread {
  let thread = initialThread
  turns.forEach((turn, index) => {
    const id = `t${index + 1}`
    thread = copilotReducer(
      thread,
      'ask' in turn
        ? {
            type: 'send',
            text: turn.ask,
            userMessageId: `${id}-question`,
            assistantMessageId: `${id}-answer`,
            sentAt,
          }
        : { type: 'decide', decision: turn.decide, assistantMessageId: id }
    )
    const isLast = index === turns.length - 1
    const ending = isLast ? last : 'complete'
    const frames =
      typeof ending === 'number'
        ? turn.frames.slice(0, ending)
        : ending === 'cut'
          ? turn.frames.filter(frame => frame.event !== 'done')
          : turn.frames
    const mapper = new V1EventMapper()
    const events: CopilotEvent[] = frames.flatMap(frame =>
      mapper.map({ event: frame.event, data: JSON.stringify(frame.data) })
    )
    // The stream closes. That ends a paused card or an early close the way
    // the transport does; mid-turn, the stream is still open.
    if (typeof ending !== 'number') events.push(...mapper.end())
    for (const event of events) {
      thread = copilotReducer(thread, { type: 'event', event })
    }
  })
  return thread
}
