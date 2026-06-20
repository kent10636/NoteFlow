import { extractPageData } from "./page-data.js";

chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
  if (message.action !== "getPageData") return;

  sendResponse(extractPageData(window, document));

  return true;
});