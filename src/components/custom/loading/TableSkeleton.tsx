/**
 * Copyright since 2025 Mifos Initiative
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */
import { Skeleton } from '@/components/ui/skeleton'

/**
 * A reusable skeleton loader for table views.
 * Renders animated placeholder rows while data is being fetched.
 *
 * @param rows - Number of skeleton rows to display (default: 5)
 * @param columns - Number of columns per row (default: 4)
 */
export default function TableSkeleton({
    rows = 5,
    columns = 4,
}: {
    rows?: number
    columns?: number
}) {
    return (
        <div className="bg-white dark:bg-zinc-800 rounded-lg border border-zinc-200 dark:border-zinc-700 shadow-sm">
            {/* Header skeleton */}
            <div className="flex gap-4 px-6 py-4 border-b border-zinc-200 dark:border-zinc-700">
                {[...Array(columns)].map((_, i) => (
                    <Skeleton key={`header-${i}`} className="h-4 flex-1 rounded" />
                ))}
            </div>

            {/* Row skeletons */}
            <div className="divide-y divide-zinc-100 dark:divide-zinc-700">
                {[...Array(rows)].map((_, i) => (
                    <div key={`row-${i}`} className="flex gap-4 px-6 py-4">
                        {[...Array(columns)].map((_, j) => (
                            <Skeleton
                                key={`cell-${i}-${j}`}
                                className="h-4 flex-1 rounded"
                            />
                        ))}
                    </div>
                ))}
            </div>
        </div>
    )
}
