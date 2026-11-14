import { DIFFICULTY, recipeHref } from "./config.js";
import { h, isSlug, imageUrl, formatMinutes, thumbName } from "./utils.js";

export function buildCard(r, categoryName, level = 2) {
  if (!r || !isSlug(r.slug)) return null;
  const total = (Number(r.prepMinutes) || 0) + (Number(r.cookMinutes) || 0);
  const full = imageUrl(r.slug, r.cover);
  const src = r.thumb === true ? imageUrl(r.slug, thumbName(r.cover)) || full : full;   // miniatura ligera para el catálogo
  const meta = [formatMinutes(total), DIFFICULTY[r.difficulty]].filter((x) => x && x !== "—").join(" · ");
  return h("article", { class: "card" },
    h("a", { class: "card-link", href: recipeHref(r.slug) },
      h("figure", { class: "card-media" },
        src && h("img", { src, alt: "", width: 640, height: 480, loading: "lazy", decoding: "async", onerror: (e) => { if (full && e.target.src !== new URL(full, location.href).href) e.target.src = full; } })),
      h("div", { class: "card-body" },
        h("p", { class: "card-cat" }, categoryName || r.category || "",
          r.demo === true && h("span", { class: "badge", text: "Prueba" })),
        h(level === 3 ? "h3" : "h2", { class: "card-title", text: String(r.title).slice(0, 140) }),
        h("p", { class: "card-meta", text: meta }))));
}
