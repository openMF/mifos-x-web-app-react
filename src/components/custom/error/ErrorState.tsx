/**
 * Copyright since 2025 Mifos Initiative
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */
import { AlertCircle } from 'lucide-react'
import { Button } from '@/components/ui/button'

/**
 * A reusable error state component.
 * Displays a clear error message with an optional retry action.
 *
 * @param message - Error message to display
 * @param onRetry - Optional callback for the retry button
 */
export default function ErrorState({
    message = 'Something went wrong.',
    onRetry,
}: {
    message?: string
    onRetry?: () => void
}) {
    return (
        <div className="max-w-lg mx-auto mt-10 rounded-lg border border-red-200 dark:border-red-900 bg-red-50 dark:bg-red-950/30 p-6">
            <div className="flex items-start gap-3">
                <AlertCircle className="h-5 w-5 text-red-600 dark:text-red-400 mt-0.5 shrink-0" />
                <div className="space-y-3">
                    <h3 className="text-sm font-semibold text-red-800 dark:text-red-300">
                        Error
                    </h3>
                    <p className="text-sm text-red-700 dark:text-red-400">{message}</p>
                    {onRetry && (
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={onRetry}
                            className="w-fit border-red-300 dark:border-red-800 text-red-700 dark:text-red-300 hover:bg-red-100 dark:hover:bg-red-900/40"
                        >
                            Retry
                        </Button>
                    )}
                </div>
            </div>
        </div>
    )
}
