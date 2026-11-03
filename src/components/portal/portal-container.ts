// An open modal dialog makes everything outside it inert, so content anchored
// inside one is rendered into that dialog instead of the document body.
export function getPortalContainer(anchor?: Element | null): Element {
  return anchor?.closest('dialog[open]') ?? document.body
}
