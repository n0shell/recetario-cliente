import { SITE, ROOT } from "./config.js";
import { h } from "./utils.js";

export function renderLayout(active) {
  document.documentElement.lang = SITE.language;
  if (document.querySelector("header.site-header")) return;   // ya viene en el HTML estático (setup.mjs / Worker)
  const skip = h("a", { class: "skip-link", href: "#contenido", text: "Saltar al contenido" });
  const header = h("header", { class: "site-header" },
    h("div", { class: "container" },
      h("a", { class: "logo", href: `${ROOT}index.html`, "aria-label": `${SITE.name}, inicio` },
        h("span", { class: "logo-name", text: SITE.logoText }),
        h("span", { class: "logo-tag", text: SITE.tagline })),
      h("nav", { class: "site-nav", "aria-label": "Principal" },
        h("a", { href: `${ROOT}index.html`, "aria-current": active === "inicio" ? "page" : null, text: "Inicio" }),
        h("a", { href: `${ROOT}index.html#recetas`, text: "Recetas" }),
        h("a", { href: `${ROOT}index.html#categorias`, text: "Categorías" }))));
  const footer = h("footer", { class: "site-footer" },
    h("div", { class: "container" },
      h("p", { class: "footer-logo", text: SITE.name }),
      h("p", { text: SITE.tagline }),
      h("p", { text: `© ${new Date().getFullYear()} ${SITE.name}` })));
  document.body.prepend(skip, header);
  document.body.append(footer);
}
