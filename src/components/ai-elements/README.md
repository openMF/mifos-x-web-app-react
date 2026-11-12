# Chat components

Building blocks for the Copilot chat. They take plain props; the Copilot's
reducer (`src/lib/copilot`) drives them.

- `message`: answers render as markdown through `markdown.ts`, which blocks
  remote images and allows only https and mailto links, so a
  prompt-injected answer cannot send client data out. It also imports
  `streamdown/styles.css` (the word reveal) and the KaTeX stylesheet.
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
