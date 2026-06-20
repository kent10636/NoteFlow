export function getSelectionText(win) {
  const selection = win.getSelection();
  return selection ? selection.toString().trim() : "";
}

export function getMetaDescription(doc) {
  const el = doc.querySelector('meta[name="description"]');
  return el?.getAttribute("content")?.trim() ?? "";
}

export function extractPageData(win, doc) {
  return {
    title: doc.title,
    url: win.location.href,
    selection: getSelectionText(win),
    content: getMetaDescription(doc),
  };
}