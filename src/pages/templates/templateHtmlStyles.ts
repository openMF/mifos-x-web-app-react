/**
 * Copyright since 2025 Mifos Initiative
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

/**
 * Typography for rendered template markup.
 *
 * Tailwind's preflight strips the browser defaults that make a heading look
 * like a heading and a list look like a list, so markup dropped into the page
 * would otherwise render as one undifferentiated block — formatting that is
 * there in the source but invisible on screen. Shared by the editor and the
 * template detail page so both show a body the same way.
 */
export const templateHtmlClasses = [
  '[&_p]:my-2',
  '[&_ul]:my-2 [&_ul]:list-disc [&_ul]:pl-6',
  '[&_ol]:my-2 [&_ol]:list-decimal [&_ol]:pl-6',
  '[&_li]:my-0.5',
  '[&_h1]:my-3 [&_h1]:text-2xl [&_h1]:font-semibold',
  '[&_h2]:my-3 [&_h2]:text-xl [&_h2]:font-semibold',
  '[&_h3]:my-2 [&_h3]:text-lg [&_h3]:font-semibold',
  '[&_h4]:my-2 [&_h4]:text-base [&_h4]:font-semibold',
  '[&_a]:text-[#1074b9] [&_a]:underline',
  '[&_blockquote]:my-2 [&_blockquote]:border-l-4 [&_blockquote]:pl-4 [&_blockquote]:italic',
  '[&_pre]:my-2 [&_pre]:font-mono [&_pre]:whitespace-pre-wrap',
  '[&_code]:font-mono [&_code]:text-sm',
  '[&_hr]:my-3 [&_hr]:border-t',
  '[&_table]:my-2 [&_table]:border-collapse',
  '[&_td]:border [&_td]:px-2 [&_td]:py-1',
  '[&_th]:border [&_th]:px-2 [&_th]:py-1 [&_th]:font-semibold',
  '[&_img]:max-w-full',
].join(' ')
