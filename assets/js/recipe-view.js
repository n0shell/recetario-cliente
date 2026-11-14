// Vista de receta compartida: la usan la web pública y la vista previa del panel.
import { DIFFICULTY } from "./config.js";
import { h, formatMinutes, formatQty } from "./utils.js";
import { buildCard } from "./card.js";

const str = (v, max = 2000) => (typeof v === "string" ? v.slice(0, max) : "");
const arr = (v, max) => (Array.isArray(v) ? v.slice(0, max) : []);

// Sanea y acota todo lo que llega del JSON antes de usarlo.
export function cleanRecipe(r) {
  const q = (v) => { const n = Number(v); return Number.isFinite(n) && n > 0 ? n : null; };
  return {
    title: str(r.title, 140), description: str(r.description, 600), category: str(r.category, 60),
    cover: str(r.cover, 90), demo: r.demo === true, updatedAt: str(r.updatedAt, 40),
    servings: Math.min(48, Math.max(1, Math.round(Number(r.servings) || 4))),
    prep: Math.max(0, Number(r.prepMinutes) || 0), cook: Math.max(0, Number(r.cookMinutes) || 0),
    difficulty: DIFFICULTY[r.difficulty] ? r.difficulty : "",
    ingredients: arr(r.ingredients, 100).map((i) => ({ qty: q(i?.qty), unit: str(i?.unit, 20), name: str(i?.name, 120) })).filter((i) => i.name),
    steps: arr(r.steps, 60).map((s) => ({ text: str(s?.text, 1500), image: str(s?.image, 90) })).filter((s) => s.text),
    tips: arr(r.tips, 20).map((t) => str(t, 800)).filter(Boolean),
    gallery: arr(r.gallery, 30).map((g) => ({ file: str(g?.file, 90), caption: str(g?.caption, 200) })).filter((g) => g.file),
  };
}

/**
 * ctx: { catName, resolveImage(file)->url|"", related:[summaries], catMap:Map,
 *        actions:{ print(), share() } | null, catHref }
 */
export function buildRecipeView(r, ctx) {
  const img = (f) => (f ? ctx.resolveImage(f) : "");
  const cover = img(r.cover);
  const base = r.servings;
  let servings = base;
  const qtyCells = [];

  const out = h("output", { class: "servings-value", text: String(servings) });
  const minus = h("button", { type: "button", class: "btn btn-icon", "aria-label": "Un comensal menos", text: "−", onclick: () => setServings(servings - 1) });
  const plus = h("button", { type: "button", class: "btn btn-icon", "aria-label": "Un comensal más", text: "+", onclick: () => setServings(servings + 1) });
  const reset = h("button", { type: "button", class: "btn-link", text: `Volver a ${base}`, hidden: true, onclick: () => setServings(base) });
  function setServings(n) {
    servings = Math.min(48, Math.max(1, n));
    out.textContent = String(servings);
    minus.disabled = servings <= 1; plus.disabled = servings >= 48;
    reset.hidden = servings === base;
    qtyCells.forEach(({ el, qty, unit }) => {
      el.textContent = qty ? [formatQty((qty * servings) / base), unit].filter(Boolean).join(" ") : "";
    });
  }

  const ingList = h("ul", { class: "ing-list" }, r.ingredients.map((i) => {
    const qtyEl = h("span", { class: "ing-qty" });
    qtyCells.push({ el: qtyEl, qty: i.qty, unit: i.unit });
    return h("li", {}, h("label", { class: "ing" },
      h("input", { type: "checkbox" }),
      h("span", { class: "ing-text" }, qtyEl, i.qty ? " " : "", i.name)));
  }));

  const meta = [["Preparación", formatMinutes(r.prep)], ["Cocción", formatMinutes(r.cook)],
    ["Total", formatMinutes(r.prep + r.cook)], ["Dificultad", DIFFICULTY[r.difficulty] || "—"], ["Comensales", String(base)]];

  const node = h("article", { class: "container recipe" },
    h("header", { class: "recipe-head" },
      h("p", { class: "eyebrow" },
        ctx.catHref ? h("a", { href: ctx.catHref, text: ctx.catName }) : h("span", { text: ctx.catName }),
        r.demo && h("span", { class: "badge", text: "Receta de prueba" })),
      h("h1", { text: r.title }),
      r.description && h("p", { class: "lead", text: r.description }),
      h("dl", { class: "meta-strip" }, meta.map(([k, v]) => h("div", {}, h("dt", { text: k }), h("dd", { text: v })))),
      ctx.actions && h("div", { class: "actions" },
        h("button", { type: "button", class: "btn btn-primary", text: "Imprimir receta", onclick: ctx.actions.print }),
        h("button", { type: "button", class: "btn", text: "Compartir", onclick: ctx.actions.share }))),
    cover && h("figure", { class: "hero" }, h("img", { src: cover, alt: r.title, width: 1200, height: 900, fetchpriority: "high", decoding: "async" })),
    h("div", { class: "recipe-body" },
      h("section", { class: "ingredients", "aria-labelledby": "h-ing" },
        h("h2", { id: "h-ing", text: "Ingredientes" }),
        h("div", { class: "servings" },
          h("span", { class: "servings-label", id: "lbl-serv", text: "Comensales" }),
          h("div", { class: "servings-controls", role: "group", "aria-labelledby": "lbl-serv" }, minus, out, plus), reset),
        ingList),
      h("section", { "aria-labelledby": "h-prep" },
        h("h2", { id: "h-prep", text: "Preparación" }),
        h("ol", { class: "steps" }, r.steps.map((s) => {
          const u = img(s.image);
          return h("li", {}, h("p", { text: s.text }),
            u && h("figure", { class: "step-fig" }, h("img", { src: u, alt: "", width: 800, height: 600, loading: "lazy", decoding: "async" })));
        })))),
    r.tips.length > 0 && h("section", { class: "tips", "aria-labelledby": "h-tips" },
      h("h2", { id: "h-tips", text: "Consejos" }), h("ul", {}, r.tips.map((t) => h("li", { text: t })))),
    r.gallery.length > 0 && h("section", { class: "gallery" },
      h("div", { class: "ornament", role: "presentation" }, h("span")),
      h("h2", { text: "Más fotografías" }),
      h("div", { class: "gallery-grid" }, r.gallery.map((g) => {
        const u = img(g.file);
        return u && h("figure", {}, h("a", { href: u, target: "_blank", rel: "noopener noreferrer" },
          h("img", { src: u, alt: g.caption, width: 800, height: 600, loading: "lazy", decoding: "async" })),
          g.caption && h("figcaption", { text: g.caption }));
      }))),
    ctx.related?.length > 0 && h("section", { class: "related", "aria-labelledby": "h-rel" },
      h("div", { class: "ornament", role: "presentation" }, h("span")),
      h("h2", { id: "h-rel", text: "Te puede interesar" }),
      h("div", { class: "grid" }, ctx.related.map((x) => buildCard(x, ctx.catMap?.get(x.category), 3)).filter(Boolean))));

  setServings(base);
  return node;
}
