import { PATHS } from "./config.js";
import { formatMinutes, formatQty } from "./format.js";
export { formatMinutes, formatQty };

// Crea elementos DOM sin innerHTML (evita XSS). Los textos siempre van como nodos de texto.
export function h(tag, attrs = {}, ...children) {
  const node = document.createElement(tag);
  for (const [k, v] of Object.entries(attrs)) {
    if (v == null || v === false) continue;
    if (k === "class") node.className = v;
    else if (k === "text") node.textContent = v;
    else if (k.startsWith("on") && typeof v === "function") node.addEventListener(k.slice(2), v);
    else if (v === true) node.setAttribute(k, "");
    else node.setAttribute(k, String(v));
  }
  for (const c of children.flat()) {
    if (c == null || c === false) continue;
    node.append(c instanceof Node ? c : document.createTextNode(String(c)));
  }
  return node;
}

const SLUG_RE = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
const FILE_RE = /^[a-z0-9][a-z0-9._-]{0,80}$/i;
// La miniatura de una portada se guarda junto a ella con el sufijo -m (p. ej. portada-ab12cd-m.webp).
export const thumbName = (file) => String(file).replace(/\.(webp|jpg|png|svg)$/, "-m.$1");
export const isSlug = (s) => typeof s === "string" && s.length <= 80 && SLUG_RE.test(s);

// Construye la ruta de una imagen solo si slug y nombre de archivo son válidos.
export function imageUrl(slug, file) {
  if (!isSlug(slug) || typeof file !== "string" || !FILE_RE.test(file) || file.includes("..")) return "";
  return `${PATHS.recipes}${slug}/${file}`;
}

export async function fetchJSON(url) {
  const res = await fetch(url, { cache: "no-cache" }); // revalida siempre (útil tras publicar)
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return res.json();
}

export const normalize = (s) =>
  String(s ?? "").normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().trim();

export function setMeta(attr, key, content) {
  let m = document.head.querySelector(`meta[${attr}="${key}"]`);
  if (!m) { m = document.createElement("meta"); m.setAttribute(attr, key); document.head.append(m); }
  m.setAttribute("content", content);
}

let toastTimer;
export function toast(msg) {
  let t = document.getElementById("toast");
  if (!t) { t = h("div", { id: "toast", class: "toast", role: "status", "aria-live": "polite" }); document.body.append(t); }
  t.textContent = msg;
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => t.remove(), 2800);
}
