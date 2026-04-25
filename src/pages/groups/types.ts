/**
 * Copyright since 2025 Mifos Initiative
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */
import type {
  GetGroupsGroupIdResponse,
  PostGroupsRequest,
  PutGroupsGroupIdRequest,
} from '@/fineract-api'

/**
 * The generated `GetGroupsGroupIdResponse` is incomplete — the real API
 * returns extra fields when `associations=all` is requested. This interface
 * extends the generated type with those additional runtime fields so that
 * downstream code can access them without double-casting through `unknown`.
 */
export interface ExtendedGroupResponse extends Omit<
  GetGroupsGroupIdResponse,
  'timeline'
> {
  active?: boolean
  staffId?: number
  staffName?: string
  staffOptions?: StaffOption[]
  clientMembers?: ClientMember[]
  collectionMeetingCalendar?: Record<string, unknown>
  centerId?: number
  status?: GroupStatus
  staff?: { displayName?: string }
  timeline?: ExtendedGroupTimeline
}

export interface ExtendedGroupTimeline {
  activatedOnDate?: string | number[]
  submittedOnDate?: string | number[]
}

export interface GroupStatus {
  id?: number
  code?: string
  value?: string
}

export interface StaffOption {
  id?: number
  displayName?: string
  name?: string
}

export interface ClientMember {
  id?: number
  displayName?: string
  officeName?: string
}

/**
 * The generated PostGroupsRequest is missing fields that the real Fineract
 * API accepts. This interface extends it with the undeclared fields so that
 * CreateGroups.tsx can pass a complete payload without TypeScript errors.
 */
export interface ExtendedPostGroupsRequest extends PostGroupsRequest {
  staffId?: number
  externalId?: string
  submittedOnDate?: string
  activationDate?: string
  dateFormat?: string
  locale?: string
}

/**
 * The generated PutGroupsGroupIdRequest only declares name. This interface
 * extends it with the remaining fields the API accepts so that EditGroups.tsx
 * can pass the full payload it already constructs.
 */
export interface ExtendedPutGroupsRequest extends PutGroupsGroupIdRequest {
  staffId?: number
  externalId?: string
  submittedOnDate?: string
  activationDate?: string
  dateFormat?: string
  locale?: string
}
