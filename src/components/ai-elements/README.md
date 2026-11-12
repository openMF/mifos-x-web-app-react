# Chat components

Building blocks for the Copilot chat. They take plain props; the Copilot's
reducer (`src/lib/copilot`) drives them.

- `message`: answers render as markdown through `markdown.ts`. Remote
  images are blocked, so nothing is fetched just by showing an answer.
  Links are limited to the https and mailto protocols, but any https host
  is allowed: a link in a prompt-injected answer could carry client data
  to that host if the officer opens it. Streamdown's link check asks the
  officer to confirm, showing the full address, before any link opens.
  `message` also imports `streamdown/styles.css` (the word reveal) and the
  KaTeX stylesheet.
- `prompt-input`: the form, textarea and submit button.
- `suggestion`: wraps onto new lines instead of scrolling sideways, which
  suits a narrow side panel.
- `chain-of-thought`: the header takes an optional `icon`. One Collapsible
  root, so the header button controls the steps it shows (`aria-controls`).
- `panel`: React Flow's `Panel`. Its position rules come from
  `@xyflow/react/dist/base.css`, imported in `src/index.css`.
- `reasoning`: content goes through the same strict markdown settings as
  `message` answers, and `ReasoningContent` takes an optional `note`.
- `shimmer`: a CSS animation, off under `prefers-reduced-motion`.

Based on AI Elements (Apache-2.0).
