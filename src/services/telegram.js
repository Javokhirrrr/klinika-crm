// src/services/telegram.js
import axios from "axios";

export function apiBase(token) {
  return `https://api.telegram.org/bot${token}`;
}

export async function tgGetMe(token) {
  const { data } = await axios.get(`${apiBase(token)}/getMe`);
  if (!data.ok) throw new Error("Invalid bot token");
  return data.result; // {id, is_bot, first_name, username}
}

export async function tgSetWebhook(token, url) {
  const { data } = await axios.post(`${apiBase(token)}/setWebhook`, { url });
  if (!data.ok) throw new Error(data.description || "setWebhook failed");
  return data.result;
}

export async function tgDeleteWebhook(token) {
  await axios.post(`${apiBase(token)}/deleteWebhook`);
}

export async function tgSendMessage(token, chatId, text, markup) {
  const payload = { chat_id: chatId, text, parse_mode: "HTML" };
  if (markup) payload.reply_markup = markup;
  const { data } = await axios.post(`${apiBase(token)}/sendMessage`, payload);
  return data;
}
