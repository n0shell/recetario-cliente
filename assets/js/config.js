// Configuración central. NO poner secretos aquí (es público).
export const SITE = {
  name: "Recetario de n0shell",
  tagline: "Cocina casera contemporánea",
  logoText: "Recetario de n0shell",
  baseUrl: "https://n0shell.github.io/recetario",   // dirección pública final, sin barra final
  language: "es"
};
// Las páginas estáticas de receta (recetas/<slug>/) indican cuántos niveles hay hasta la raíz del sitio.
const rootMeta = typeof document !== "undefined" ? document.querySelector('meta[name="site-root"]')?.content ?? "" : "";
export const ROOT = /^(?:\.\.\/)*$/.test(rootMeta) ? rootMeta : "";
export const PATHS = { index: `${ROOT}data/index.json`, recipes: `${ROOT}data/recipes/` };
export const recipeHref = (slug) => `${ROOT}recetas/${encodeURIComponent(slug)}/`;
export const DIFFICULTY = { facil: "Fácil", media: "Media", dificil: "Difícil" };
