function getSelectionText() {
  const selection = window.getSelection();
  return selection ? selection.toString().trim() : "";
}

function getMetaDescription() {
  const el = document.querySelector('meta[name="description"]');
  return el?.getAttribute("content")?.trim() ?? "";
}

chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
  if (message.action !== "getPageData") return;

  sendResponse({
    title: document.title,
    url: location.href,
    selection: getSelectionText(),
    content: getMetaDescription(),
  });

  return true;
});