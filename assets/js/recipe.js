import { renderLayout } from "./layout.js";
import { SITE, PATHS, ROOT, recipeHref } from "./config.js";
import { fetchJSON, isSlug, imageUrl, setMeta, toast } from "./utils.js";
import { cleanRecipe, buildRecipeView } from "./recipe-view.js";
import { h } from "./utils.js";

renderLayout("receta");
const main = document.getElementById("contenido");
const slug = document.querySelector('meta[name="recipe-slug"]')?.content ?? new URLSearchParams(location.search).get("r") ?? "";
const arr = (v, max) => (Array.isArray(v) ? v.slice(0, max) : []);

function message(title, text) {
  main.removeAttribute("aria-busy");
  main.replaceChildren(h("div", { class: "container state-box" },
    h("h1", { text: title }), h("p", { text }),
    h("a", { class: "btn", href: `${ROOT}index.html`, text: "Ver todas las recetas" })));
  document.title = `${title} · ${SITE.name}`;
}

function updateSeo(r, catName, cover) {
  document.title = `${r.title} · ${SITE.name}`;
  const abs = (p) => new URL(p, location.href).href;
  setMeta("name", "description", r.description || `${r.title}: receta paso a paso.`);
  setMeta("property", "og:type", "article");
  setMeta("property", "og:title", r.title);
  setMeta("property", "og:description", r.description);
  if (cover) setMeta("property", "og:image", abs(cover));
  if (SITE.baseUrl) {
    let c = document.head.querySelector('link[rel="canonical"]');
    if (!c) { c = document.createElement("link"); c.rel = "canonical"; document.head.append(c); }
    c.href = `${SITE.baseUrl}/recetas/${slug}/`;
  }
  const iso = (m) => (m > 0 ? `PT${Math.round(m)}M` : undefined);
  const ld = {
    "@context": "https://schema.org", "@type": "Recipe", name: r.title, description: r.description,
    image: cover ? [abs(cover)] : undefined, recipeCategory: catName, recipeYield: `${r.servings} raciones`,
    prepTime: iso(r.prep), cookTime: iso(r.cook), totalTime: iso(r.prep + r.cook),
    recipeIngredient: r.ingredients.map((i) => [i.qty ?? "", i.unit, i.name].filter((x) => x !== "").join(" ")),
    recipeInstructions: r.steps.map((s) => ({ "@type": "HowToStep", text: s.text })),
  };
  const s = document.createElement("script");
  s.type = "application/ld+json";
  s.textContent = JSON.stringify(ld).replace(/</g, "\\u003c");
  document.head.append(s);
}

async function share(r) {
  if (navigator.share) {
    try { await navigator.share({ title: r.title, text: r.description, url: location.href }); return; }
    catch (e) { if (e.name === "AbortError") return; }
  }
  try { await navigator.clipboard.writeText(location.href); toast("Enlace copiado"); }
  catch { toast("No se pudo copiar el enlace"); }
}

function render(r, index) {
  const catMap = new Map(arr(index?.categories, 100).filter((c) => c && typeof c.id === "string")
    .map((c) => [c.id, String(c.name).slice(0, 60)]));
  const catName = catMap.get(r.category) || r.category;
  const related = arr(index?.recipes, 500)
    .filter((x) => x && isSlug(x.slug) && x.slug !== slug && typeof x.title === "string" && x.status !== "draft")
    .sort((a, b) => (b.category === r.category) - (a.category === r.category) || String(b.createdAt).localeCompare(String(a.createdAt)))
    .slice(0, 3);
  const node = buildRecipeView(r, {
    catName, catMap, related,
    catHref: `${ROOT}index.html?cat=${encodeURIComponent(r.category)}#recetas`,
    resolveImage: (f) => imageUrl(slug, f),
    actions: { print: () => window.print(), share: () => share(r) },
  });
  main.removeAttribute("aria-busy");
  main.replaceChildren(node);
  updateSeo(r, catName, imageUrl(slug, r.cover));
}

async function init() {
  if (!isSlug(slug)) return message("Receta no encontrada", "El enlace no es válido.");
  try {
    const [raw, index] = await Promise.all([
      fetchJSON(`${PATHS.recipes}${slug}/receta.json`),
      fetchJSON(PATHS.index).catch(() => null),
    ]);
    if (!raw || (raw.status && raw.status !== "published")) return message("Receta no encontrada", "Esta receta no existe o no está publicada.");
    const r = cleanRecipe(raw);
    if (!r.title) return message("Receta no encontrada", "Los datos de la receta no son válidos.");
    render(r, index);
  } catch (e) {
    if (String(e.message) === "HTTP 404") message("Receta no encontrada", "Esta receta no existe o no está publicada.");
    else message("No se pudo cargar la receta", "Inténtalo de nuevo en unos minutos.");
  }
}
init();
