export const DOCUMENT_TITLE_PREFIX = "OpenShift Console Platform";

export function formatDocumentTitle(pageTitle: string): string {
  const trimmed = pageTitle.trim();
  if (!trimmed) return DOCUMENT_TITLE_PREFIX;
  return `${DOCUMENT_TITLE_PREFIX} - ${trimmed}`;
}

/** Read the visible page heading from rendered console content. */
export function readPageTitleFromDom(root: ParentNode | null | undefined): string | null {
  if (!root) return null;

  const byId = root.querySelector("#main-title");
  const fromId = byId?.textContent?.replace(/\s+/g, " ").trim();
  if (fromId) return fromId;

  const h1 = root.querySelector("h1");
  const fromH1 = h1?.textContent?.replace(/\s+/g, " ").trim();
  if (fromH1) return fromH1;

  return null;
}
