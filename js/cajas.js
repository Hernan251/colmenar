// js/cajas.js
// Capa de datos para las cajas: leer, crear y actualizar contra Supabase.

function rowToCaja(r) {
  return {
    num: r.num,
    estado: r.estado || "",
    fechaColocacion: r.fecha_colocacion || "",
    fechaIngreso: r.fecha_ingreso || "",
    alzas: r.alzas != null ? r.alzas : 0,
    melado: r.melado || "",
    miel: r.miel != null ? Number(r.miel) : 0,
    fechaRevision: r.fecha_revision || "",
    ubicacion: r.ubicacion || "",
    observaciones: r.observaciones || "",
  };
}

function cajaToRow(c) {
  return {
    num: c.num,
    estado: c.estado || null,
    fecha_colocacion: c.fechaColocacion || null,
    fecha_ingreso: c.fechaIngreso || null,
    alzas: Number(c.alzas) || 0,
    melado: c.melado || null,
    miel: Number(c.miel) || 0,
    fecha_revision: c.fechaRevision || null,
    ubicacion: c.ubicacion || null,
    observaciones: c.observaciones || null,
    updated_at: new Date().toISOString(),
  };
}

function blankCaja(num) {
  return {
    num: num,
    estado: "",
    fechaColocacion: "",
    fechaIngreso: "",
    alzas: 0,
    melado: "",
    miel: 0,
    fechaRevision: "",
    ubicacion: "",
    observaciones: "",
  };
}

// SCRUM-10: traer todas las cajas, ordenadas por número.
async function listarCajas() {
  const rows = await fetchColmenas();
  return rows.map(rowToCaja);
}

// SCRUM-11 / SCRUM-12: crear o actualizar una caja (upsert por número).
async function guardarCaja(caja) {
  const res = await fetch(`${SUPABASE_URL}/${TABLE_COLMENAS}?on_conflict=num`, {
    method: "POST",
    headers: sbHeaders({
      Prefer: "resolution=merge-duplicates,return=representation",
    }),
    body: JSON.stringify([cajaToRow(caja)]),
  });
  if (!res.ok) throw new Error("HTTP " + res.status);
  const data = await res.json();
  return rowToCaja(data[0]);
}

// Próximo número libre para una caja nueva.
function proximoNumero(cajas) {
  const max = cajas.reduce((m, c) => Math.max(m, c.num), 0);
  return max + 1;
}
