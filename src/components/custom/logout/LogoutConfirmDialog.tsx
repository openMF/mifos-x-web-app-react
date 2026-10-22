/**
 * Copyright since 2025 Mifos Initiative
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { useTranslation } from 'react-i18next'

type LogoutConfirmDialogProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  onConfirm: () => void
}

/**
 * Confirmation shown before a user-initiated sign-out.
 *
 * The sign-out itself lives in `useLogout`; this component only decides when it
 * runs. Automatic sign-outs (for example an expired session) call the hook
 * directly and deliberately skip this dialog, so the user is never asked to
 * confirm an action they did not take.
 */
export const LogoutConfirmDialog = ({
  open,
  onOpenChange,
  onConfirm,
}: LogoutConfirmDialogProps) => {
  const { t } = useTranslation(['auth', 'common'])

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>{t('auth:logout.signOut')}</AlertDialogTitle>
          <AlertDialogDescription>
            {t('auth:logout.confirm')}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>{t('common:actions.cancel')}</AlertDialogCancel>
          <AlertDialogAction
            className="bg-red-600 text-white hover:bg-red-700"
            onClick={onConfirm}
          >
            {t('auth:logout.signOut')}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}
