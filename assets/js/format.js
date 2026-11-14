// Formato de tiempos y cantidades. Módulo puro: lo usan la web, el panel y el Worker.
export function formatMinutes(min) {
  min = Math.round(Number(min) || 0);
  if (min <= 0) return "—";
  const hh = Math.floor(min / 60), mm = min % 60;
  if (!hh) return `${mm} min`;
  return mm ? `${hh} h ${mm} min` : `${hh} h`;
}

const FRACS = [[1 / 8, "⅛"], [1 / 4, "¼"], [1 / 3, "⅓"], [3 / 8, "⅜"], [1 / 2, "½"], [5 / 8, "⅝"], [2 / 3, "⅔"], [3 / 4, "¾"], [7 / 8, "⅞"]];

export function formatQty(q) {
  if (!Number.isFinite(q) || q <= 0) return "";
  if (q >= 10) return String(Math.round(q));
  let whole = Math.floor(q);
  const frac = q - whole;
  if (frac < 0.04) return String(whole);
  if (frac > 0.96) return String(whole + 1);
  const hit = FRACS.find(([v]) => Math.abs(v - frac) < 0.04);
  if (hit) return whole ? `${whole}${hit[1]}` : hit[1];
  return q.toLocaleString("es-ES", { maximumFractionDigits: 1 });
}
