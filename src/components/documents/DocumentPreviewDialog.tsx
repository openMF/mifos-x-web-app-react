/**
 * Copyright since 2025 Mifos Initiative
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */
import { useTranslation } from 'react-i18next'
import { ExternalLink } from 'lucide-react'

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import type { DocumentPreviewType } from '@/lib/document-preview'

export type DocumentPreview = {
  url: string
  type: DocumentPreviewType
  name?: string
  fileName?: string
}

type Props = {
  preview: DocumentPreview | null
  loading?: boolean
  error?: string | null
  onClose: () => void
}

/**
 * Renders a downloaded document inline.
 *
 * PDFs use `<embed type="application/pdf">`, which relies on the browser's built-in
 * viewer. Safari and iOS refuse to render `blob:` PDFs that way, so the dialog always
 * offers opening the document in a new tab as a fallback.
 */
const DocumentPreviewDialog = ({
  preview,
  loading = false,
  error = null,
  onClose,
}: Props) => {
  const { t } = useTranslation('common')

  const open = loading || !!error || !!preview
  const title = preview?.name || preview?.fileName || t('documents.preview')

  return (
    <Dialog open={open} onOpenChange={value => !value && onClose()}>
      <DialogContent className="sm:max-w-4xl">
        <DialogHeader>
          <DialogTitle className="truncate">{title}</DialogTitle>
          {preview?.fileName && (
            <DialogDescription className="truncate">
              {preview.fileName}
            </DialogDescription>
          )}
        </DialogHeader>

        <div className="flex min-h-[20rem] items-center justify-center overflow-hidden rounded border bg-zinc-50 dark:bg-zinc-900">
          {loading && (
            <p className="text-sm text-zinc-500">{t('documents.loading')}</p>
          )}

          {!loading && error && (
            <p className="px-6 text-center text-sm text-red-600">{error}</p>
          )}

          {!loading && !error && preview?.type === 'pdf' && (
            <embed
              src={preview.url}
              type="application/pdf"
              className="h-[70vh] w-full"
              aria-label={title}
            />
          )}

          {!loading && !error && preview?.type === 'image' && (
            <img
              src={preview.url}
              alt={title}
              className="max-h-[70vh] w-auto max-w-full object-contain"
            />
          )}
        </div>

        <DialogFooter>
          {preview && (
            <Button
              variant="outline"
              onClick={() => window.open(preview.url, '_blank')}
            >
              <ExternalLink className="mr-1 h-4 w-4" />
              {t('documents.openInNewTab')}
            </Button>
          )}
          <Button
            className="bg-[#0e77b7] hover:bg-[#0662a3] text-white border-0"
            onClick={onClose}
          >
            {t('documents.close')}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

export default DocumentPreviewDialog
