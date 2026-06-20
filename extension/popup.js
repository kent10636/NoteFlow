import { normalizeBaseUrl, validateClipConfig } from "./config.js";

const baseUrlInput = document.getElementById("baseUrl");
const tokenInput = document.getElementById("token");
const saveBtn = document.getElementById("save");
const clipBtn = document.getElementById("clip");
const statusEl = document.getElementById("status");

function setStatus(text, isError = false) {
  statusEl.textContent = text;
  statusEl.style.color = isError ? "#b91c1c" : "#666";
}

chrome.storage.sync.get(["baseUrl", "token"], (data) => {
  if (data.baseUrl) baseUrlInput.value = data.baseUrl;
  if (data.token) tokenInput.value = data.token;
});

saveBtn.addEventListener("click", () => {
  const baseUrl = normalizeBaseUrl(baseUrlInput.value);
  const token = tokenInput.value.trim();
  const error = validateClipConfig(baseUrl, token);

  if (error) {
    setStatus(error, true);
    return;
  }

  chrome.storage.sync.set({ baseUrl, token }, () => {
    setStatus("配置已保存");
  });
});

clipBtn.addEventListener("click", async () => {
  clipBtn.disabled = true;
  setStatus("剪藏中...");

  try {
    const { baseUrl, token } = await chrome.storage.sync.get([
      "baseUrl",
      "token",
    ]);

    const configError = validateClipConfig(baseUrl ?? "", token ?? "");
    if (configError) {
      throw new Error("请先保存地址和令牌");
    }

    const [tab] = await chrome.tabs.query({
      active: true,
      currentWindow: true,
    });

    if (!tab?.id) throw new Error("无法获取当前标签页");

    const pageData = await chrome.tabs.sendMessage(tab.id, {
      action: "getPageData",
    });

    const res = await fetch(`${normalizeBaseUrl(baseUrl)}/api/clip`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(pageData),
    });

    const data = await res.json();
    if (!res.ok) throw new Error(data.error ?? "剪藏失败");

    setStatus(`已保存：${data.title}`);
  } catch (err) {
    setStatus(err.message ?? "剪藏失败", true);
  } finally {
    clipBtn.disabled = false;
  }
});