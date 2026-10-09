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
    latitud: r.latitud != null ? Number(r.latitud) : null,
    longitud: r.longitud != null ? Number(r.longitud) : null,
    ubicacionFecha: r.ubicacion_fecha || null,
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
    latitud: null,
    longitud: null,
    ubicacionFecha: null,
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

// SCRUM-20 / SCRUM-23: guardar (o actualizar) solo las coordenadas GPS de una caja.
// Se usa PATCH para no pisar otros datos que estén sin guardar en el editor.
async function guardarUbicacion(num, latitud, longitud, fechaISO) {
  const res = await fetch(`${SUPABASE_URL}/${TABLE_COLMENAS}?num=eq.${num}`, {
    method: "PATCH",
    headers: sbHeaders({ Prefer: "return=representation" }),
    body: JSON.stringify({
      latitud: latitud,
      longitud: longitud,
      ubicacion_fecha: fechaISO,
      updated_at: new Date().toISOString(),
    }),
  });
  if (!res.ok) throw new Error("HTTP " + res.status);
  const data = await res.json();
  if (!data.length) throw new Error("La caja no existe");
  return rowToCaja(data[0]);
}