/**
 * Copyright since 2025 Mifos Initiative
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */
import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import { AppBreadCrumbs } from '@/components/custom/breadcrumbs/AppBreadCrumbs'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faPenToSquare, faTrash } from '@fortawesome/free-solid-svg-icons'

import { getConfiguration } from '@/lib/fineract-openapi'
import { sanitizeHtml } from '@/lib/sanitize-html'
import {
  UserGeneratedDocumentsApi,
  type GetTemplatesTemplateIdResponse,
} from '@/fineract-api'

import { detectTemplateTextFormat } from './templateText'
import { templateHtmlClasses } from './templateHtmlStyles'

//templates API
const templatesApi = new UserGeneratedDocumentsApi(getConfiguration())

const ViewTemplates = () => {
  const navigate = useNavigate()
  const { id } = useParams()

  //state to fetch template by id
  const [template, setTemplate] = useState<GetTemplatesTemplateIdResponse>()

  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchTemplate = async () => {
      try {
        const response = await templatesApi.retrieveOne30(Number(id))
        setTemplate(response.data)
      } catch (err) {
        console.error('Failed to fetch template details', err)
      } finally {
        setLoading(false)
      }
    }
    fetchTemplate()
  }, [id])

  const handleDelete = async () => {
    try {
      await templatesApi.deleteTemplate(Number(id))
      navigate('/templates')
    } catch (err) {
      console.error('Failed to delete template', err)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-zinc-500">Loading...</p>
      </div>
    )
  }

  return (
    <div className="min-h-screen px-6 py-10 bg-gray-50 dark:bg-zinc-900">
      <AppBreadCrumbs
        items={[
          { label: 'Home', href: '/home' },
          { label: 'Templates', href: '/templates' },
          { label: `${template?.id}`, current: true },
        ]}
      />

      <div className="bg-white dark:bg-zinc-800 shadow-md rounded-lg p-8 max-w-2xl mx-auto">
        <div className="flex mb-6 gap-3">
          <Button
            className="bg-[#1074b9] hover:bg-[#1074c9] cursor-pointer text-white"
            onClick={() => navigate(`/templates/${template?.id}/edit`)}
          >
            <FontAwesomeIcon icon={faPenToSquare} className="mr-2" />
            Edit
          </Button>

          <Button
            className="bg-red-600 hover:bg-red-700 text-white"
            onClick={handleDelete}
          >
            <FontAwesomeIcon icon={faTrash} className="mr-2" />
            Delete
          </Button>
        </div>

        <h2 className="text-xl font-semibold mb-6 text-zinc-800 dark:text-zinc-100">
          Template Details
        </h2>

        {/* Main Content */}
        <div className="grid grid-cols-2 gap-y-5 text-sm text-zinc-700 dark:text-zinc-200">
          <div className="font-medium">Name</div>
          <div className="text-zinc-600 dark:text-zinc-400">
            {template?.name}
          </div>

          <div className="font-medium">Entity</div>
          <div className="text-zinc-600 dark:text-zinc-400">
            {template?.entity}
          </div>

          <div className="font-medium">Type</div>
          <div className="text-zinc-600 dark:text-zinc-400">
            {template?.type}
          </div>
        </div>

        {/* The body is rendered in the format it was authored in: markup as
            markup, and plain text with its line breaks intact — showing either
            one as a raw string is what made a saved template look mangled. */}
        <div className="mt-5 text-sm text-zinc-700 dark:text-zinc-200">
          <div className="font-medium mb-2">Text</div>
          {detectTemplateTextFormat(template?.text) === 'html' ? (
            <div
              className={`text-zinc-600 dark:text-zinc-400 ${templateHtmlClasses}`}
              // Sanitised above: template bodies are stored by other users.
              dangerouslySetInnerHTML={{
                __html: sanitizeHtml(template?.text ?? ''),
              }}
            />
          ) : (
            <div className="whitespace-pre-wrap text-zinc-600 dark:text-zinc-400">
              {template?.text}
            </div>
          )}
        </div>

        <div className="flex justify-center mt-8">
          <Button
            variant="outline"
            className="w-28 cursor-pointer"
            onClick={() => navigate('/templates')}
          >
            Back
          </Button>
        </div>
      </div>
    </div>
  )
}

export default ViewTemplates
