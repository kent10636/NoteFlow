export function normalizeBaseUrl(url) {
  return url.trim().replace(/\/$/, "");
}

export function validateClipConfig(baseUrl, token) {
  if (!normalizeBaseUrl(baseUrl) || !token.trim()) {
    return "请填写地址和令牌";
  }
  return null;
}