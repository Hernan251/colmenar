// js/resumen.js
// SCRUM-31: totales generales del apiario.
// SCRUM-32: promedios de alzas y de miel.
// SCRUM-33: distribución de alzas por caja.
// SCRUM-34: estado de las revisiones (reciente / pendiente / sin fecha).
// SCRUM-35: proporción con abejas vs. sin abejas.

const DIAS_REVISION_RECIENTE = 15;

function diasDesde(iso) {
  if (!iso) return null;
  const antes = new Date(iso + "T00:00:00");
  return Math.floor((new Date() - antes) / (1000 * 60 * 60 * 24));
}

function calcularResumen() {
  const total = cajas.length;
  const conAbejas = cajas.filter((c) => c.estado === "Con abejas");
  const sinAbejas = cajas.filter((c) => c.estado === "Sin abejas");
  const sinEstado = total - conAbejas.length - sinAbejas.length;
  const meladas = cajas.filter((c) => c.melado === "Sí");

  const totalAlzas = cajas.reduce((s, c) => s + (Number(c.alzas) || 0), 0);
  const totalMiel = cajas.reduce((s, c) => s + (Number(c.miel) || 0), 0);

  // SCRUM-32: promedio de alzas entre cajas con abejas, y de miel entre cajas melada.
  const promAlzas = conAbejas.length
    ? conAbejas.reduce((s, c) => s + (Number(c.alzas) || 0), 0) / conAbejas.length
    : 0;
  const promMiel = meladas.length
    ? meladas.reduce((s, c) => s + (Number(c.miel) || 0), 0) / meladas.length
    : 0;

  // SCRUM-33: distribución de alzas (0, 1, 2, 3, 4, 5 o más) entre cajas con abejas.
  const alzas = [0, 0, 0, 0, 0, 0];
  conAbejas.forEach((c) => {
    const a = Number(c.alzas) || 0;
    alzas[a >= 5 ? 5 : a]++;
  });

  // SCRUM-34: estado de revisiones.
  let reciente = 0, pendiente = 0, sinFecha = 0;
  cajas.forEach((c) => {
    const d = diasDesde(c.fechaRevision);
    if (d === null) sinFecha++;
    else if (d <= DIAS_REVISION_RECIENTE) reciente++;
    else pendiente++;
  });

  return {
    total, conAbejas: conAbejas.length, sinAbejas: sinAbejas.length, sinEstado,
    meladas: meladas.length, totalAlzas, totalMiel, promAlzas, promMiel,
    alzas, reciente, pendiente, sinFecha,
  };
}

function barra(valor, max, color) {
  const pct = max > 0 ? Math.round((valor / max) * 100) : 0;
  return `<div class="bar-track"><div class="bar-fill" style="width:${pct}%; background:${color};"></div></div>`;
}

function filaBarra(etiqueta, valor, max, color, sufijo) {
  return `
    <div class="bar-row">
      <div class="bar-label"><span>${etiqueta}</span><span>${valor}${sufijo || ""}</span></div>
      ${barra(valor, max, color)}
    </div>`;
}

function renderResumen() {
  const r = calcularResumen();
  const el = document.getElementById("view-resumen");

  if (!r.total) {
    el.innerHTML = `<p class="muted">Todavía no hay cajas registradas, así que no hay nada para resumir.</p>`;
    return;
  }

  const maxAlzas = Math.max(...r.alzas, 1);
  const etiquetasAlzas = ["0 alzas", "1 alza", "2 alzas", "3 alzas", "4 alzas", "5 o más alzas"];

  el.innerHTML = `
    <div class="stat-grid">
      <div class="stat-card"><div class="val">${r.total}</div><div class="lbl">Total de cajas</div></div>
      <div class="stat-card"><div class="val">${r.conAbejas}</div><div class="lbl">Con abejas</div></div>
      <div class="stat-card"><div class="val">${r.totalAlzas}</div><div class="lbl">Total de alzas</div></div>
      <div class="stat-card"><div class="val">${r.totalMiel.toFixed(1)} kg</div><div class="lbl">Miel cosechada</div></div>
      <div class="stat-card"><div class="val">${r.promAlzas.toFixed(2)}</div><div class="lbl">Promedio de alzas por caja con abejas</div></div>
      <div class="stat-card"><div class="val">${r.promMiel.toFixed(2)} kg</div><div class="lbl">Promedio de miel por caja melada</div></div>
    </div>

    <div class="panel">
      <h3>Estado de las revisiones</h3>
      ${filaBarra(`Reciente (hasta ${DIAS_REVISION_RECIENTE} días)`, r.reciente, r.total, "var(--green)")}
      ${filaBarra(`Necesita revisión (más de ${DIAS_REVISION_RECIENTE} días)`, r.pendiente, r.total, "var(--clay)")}
      ${filaBarra("Sin fecha registrada", r.sinFecha, r.total, "var(--text-muted)")}
    </div>

    <div class="panel">
      <h3>Alzas por caja (cajas con abejas)</h3>
      ${etiquetasAlzas.map((e, i) => filaBarra(e, r.alzas[i], maxAlzas, "var(--honey)")).join("")}
    </div>

    <div class="panel">
      <h3>Con abejas vs. sin abejas</h3>
      ${filaBarra("Con abejas", r.conAbejas, r.total, "var(--green)", ` / ${r.total}`)}
      ${filaBarra("Sin abejas", r.sinAbejas, r.total, "#B9A47C", ` / ${r.total}`)}
      ${r.sinEstado ? filaBarra("Sin estado marcado", r.sinEstado, r.total, "var(--honey)", ` / ${r.total}`) : ""}
    </div>
  `;
}
