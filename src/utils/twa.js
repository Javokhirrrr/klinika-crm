// src/utils/twa.js
import crypto from "crypto";

export function parseInitData(initData) {
  // initData string yoki initDataUnsafe obyektini qabul qiladi
  const str = typeof initData === "string"
    ? initData
    : new URLSearchParams(Object.entries(initData || {})).toString();
  const params = Object.fromEntries(new URLSearchParams(str));
  if (params.user) params.user = JSON.parse(params.user);
  return { str, params };
}

export function verifyInitData(initData, botToken) {
  const { str, params } = parseInitData(initData);
  const url = new URLSearchParams(str);
  const hash = url.get("hash");
  url.delete("hash");
  const dataCheckString = Array.from(url.keys())
    .sort()
    .map(k => `${k}=${url.get(k)}`)
    .join("\n");

  const secret = crypto.createHmac("sha256", "WebAppData")
                       .update(botToken)
                       .digest();
  const h = crypto.createHmac("sha256", secret)
                  .update(dataCheckString)
                  .digest("hex");

  return h === hash ? params : null;
}
