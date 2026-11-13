// An open modal dialog makes everything outside it inert, so content anchored
// inside one is rendered into that dialog instead of the document body. Any
// dialog counts, open or not: a dialog opens in an effect that runs after its
// children mount, so it is often not open yet when a tooltip or popover inside
// it picks its container.
export function getPortalContainer(anchor?: Element | null): Element {
  return anchor?.closest('dialog') ?? document.body
}
