# AI Elements

Chat building blocks adapted from [AI Elements](https://ai-sdk.dev/elements)
(Apache-2.0, Vercel). They are copied in, as shadcn components are, and
changed where this app needs it:

- No `ai` SDK types. Components take plain props; the Copilot's own reducer
  (`src/lib/copilot`) drives them.
- `message`: `MessageResponse` keeps upstream's sanitising but blocks remote
  images and allows only https and mailto links, so a prompt-injected
  answer cannot send client data out. Label props for translation.
- `prompt-input`: only the form, textarea, footer and submit. No
  attachments, model picker or commands, which the gateway does not support.
- `suggestion`: wraps onto new lines instead of scrolling sideways, which
  suits a narrow side panel.
- `chain-of-thought`: the header takes an optional `icon`. One Collapsible root, so the header button controls
  the steps it shows (`aria-controls`).
- `panel`: as upstream, React Flow's `Panel`. Its position rules come from
  `@xyflow/react/dist/base.css`, imported in `src/index.css`.
- `message` also imports `streamdown/styles.css`, the keyframes for the
  `animated` word reveal.
- `reasoning`: content goes through the same strict markdown settings as
  `message` answers, and `ReasoningContent` takes an optional `note`.
- `shimmer`: CSS animation instead of `motion`, and still under
  `prefers-reduced-motion`.
