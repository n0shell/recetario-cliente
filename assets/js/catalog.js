import { renderLayout } from "./layout.js";
import { PATHS } from "./config.js";
import { h, fetchJSON, normalize, isSlug } from "./utils.js";
import { buildCard } from "./card.js";

renderLayout("inicio");

const $ = (id) => document.getElementById(id);
const grid = $("grid"), count = $("count"), chips = $("chips"), qInput = $("q"), sortSel = $("sort");
const params = new URLSearchParams(location.search);
const state = {
  q: (params.get("q") ?? "").slice(0, 80),
  cat: params.get("cat") ?? "",
  sort: params.get("sort") === "name" ? "name" : "date",
};
let recipes = [];
let categories = new Map();

function syncURL() {
  const p = new URLSearchParams();
  if (state.q) p.set("q", state.q);
  if (state.cat) p.set("cat", state.cat);
  if (state.sort !== "date") p.set("sort", state.sort);
  const qs = p.toString();
  history.replaceState(null, "", qs ? `?${qs}${location.hash}` : `${location.pathname}${location.hash}`);
}

function showSkeleton() {
  grid.setAttribute("aria-busy", "true");
  grid.replaceChildren(...Array.from({ length: 6 }, () =>
    h("div", { class: "card skeleton", "aria-hidden": "true" },
      h("div", { class: "card-media" }),
      h("div", { class: "card-body" }, h("p", { class: "sk-line" }), h("p", { class: "sk-line short" })))));
}

function showError() {
  grid.removeAttribute("aria-busy");
  count.textContent = "";
  grid.replaceChildren(h("div", { class: "state-box" },
    h("h2", { text: "No se pudieron cargar las recetas" }),
    h("p", { text: "Comprueba tu conexión e inténtalo de nuevo." }),
    h("button", { type: "button", class: "btn", text: "Reintentar", onclick: load })));
}

function buildChips() {
  const counts = new Map();
  recipes.forEach((r) => counts.set(r.category, (counts.get(r.category) || 0) + 1));
  if (state.cat && !counts.has(state.cat)) state.cat = "";
  const mk = (id, label) => h("button", {
    type: "button", class: "chip", "aria-pressed": String(state.cat === id), text: label,
    onclick: () => { state.cat = id; syncURL(); buildChips(); render(); },
  });
  chips.replaceChildren(mk("", `Todas (${recipes.length})`),
    ...[...counts.entries()].map(([id, n]) => mk(id, `${categories.get(id) || id} (${n})`)));
}

function render() {
  grid.removeAttribute("aria-busy");
  const q = normalize(state.q);
  const list = recipes
    .filter((r) => !state.cat || r.category === state.cat)
    .filter((r) => !q || normalize(`${r.title} ${r.description ?? ""} ${categories.get(r.category) ?? r.category}`).includes(q))
    .sort((a, b) => state.sort === "name"
      ? a.title.localeCompare(b.title, "es")
      : String(b.createdAt ?? "").localeCompare(String(a.createdAt ?? "")));

  count.textContent = list.length === 1 ? "1 receta" : `${list.length} recetas`;
  if (!list.length) {
    grid.replaceChildren(h("div", { class: "state-box" },
      h("h2", { text: recipes.length ? "Ninguna receta coincide" : "Todavía no hay recetas publicadas" }),
      recipes.length > 0 && h("p", { text: "Prueba con otras palabras o quita los filtros." }),
      recipes.length > 0 && h("button", { type: "button", class: "btn", text: "Quitar filtros", onclick: resetFilters })));
    return;
  }
  grid.replaceChildren(...list.map((r) => buildCard(r, categories.get(r.category))).filter(Boolean));
}

function resetFilters() {
  state.q = ""; state.cat = ""; qInput.value = "";
  syncURL(); buildChips(); render();
}

async function load() {
  showSkeleton();
  try {
    const data = await fetchJSON(PATHS.index);
    recipes = (Array.isArray(data.recipes) ? data.recipes : [])
      .filter((r) => r && isSlug(r.slug) && typeof r.title === "string" && r.status !== "draft");
    categories = new Map((Array.isArray(data.categories) ? data.categories : [])
      .filter((c) => c && typeof c.id === "string" && typeof c.name === "string")
      .map((c) => [c.id, c.name]));
    buildChips();
    render();
  } catch {
    showError();
  }
}

qInput.value = state.q;
sortSel.value = state.sort;
qInput.addEventListener("input", () => { state.q = qInput.value.slice(0, 80); syncURL(); render(); });
sortSel.addEventListener("change", () => { state.sort = sortSel.value === "name" ? "name" : "date"; syncURL(); render(); });
$("search-form").addEventListener("submit", (e) => e.preventDefault());
load();
