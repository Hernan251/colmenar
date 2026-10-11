// js/editor.js
// SCRUM-13: cantidad de alzas.
// SCRUM-14: melado y cantidad de miel.
// SCRUM-15: fecha de última revisión.
// SCRUM-16: observaciones libres.

let editando = null;
let gpsMsg = null; // { tipo: "ok" | "error", texto: "..." }
let gpsBuscando = false;

function fmtFechaHora(iso) {
  if (!iso) return "—";
  const d = new Date(iso);
  const dd = String(d.getDate()).padStart(2, "0");
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const hh = String(d.getHours()).padStart(2, "0");
  const mi = String(d.getMinutes()).padStart(2, "0");
  return `${dd}/${mm}/${d.getFullYear()} ${hh}:${mi}`;
}

function hoyISO() {
  const d = new Date();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const dia = String(d.getDate()).padStart(2, "0");
  return `${d.getFullYear()}-${m}-${dia}`;
}

function abrirEditor(caja) {
  editando = JSON.parse(JSON.stringify(caja));
  gpsMsg = null;
  gpsBuscando = false;
  // Regla: sin alzas no se puede melar.
  if ((Number(editando.alzas) || 0) < 1 && editando.melado === "Sí") {
    editando.melado = "No";
    editando.miel = 0;
  }
  const editable = puede("editar");
  document.getElementById("sheet-title").textContent = `Caja ${pad2(caja.num)}${editable ? "" : " · solo lectura"}`;
  document.getElementById("sheet-save").style.display = editable ? "" : "none";
  document.getElementById("sheet-cancel").textContent = editable ? "Cancelar" : "Cerrar";
  renderEditor();
  document.getElementById("backdrop").classList.add("open");
  document.getElementById("sheet").classList.add("open");
}

function cerrarEditor() {
  document.getElementById("backdrop").classList.remove("open");
  document.getElementById("sheet").classList.remove("open");
  editando = null;
}

function renderEditor() {
  const c = editando;
  const soloLectura = !puede("editar");
  const sinAbejas = c.estado === "Sin abejas";
  const sinAlzas = (Number(c.alzas) || 0) < 1;
  const noPuedeMelar = sinAbejas || sinAlzas;
  const mielBloqueada = c.melado !== "Sí";

  document.getElementById("sheet-body").innerHTML = `
    <div class="campo ${sinAbejas ? "bloqueado" : ""}">
      <label>Cantidad de alzas</label>
      <div class="stepper">
        <button type="button" id="alzas-menos" ${sinAbejas ? "disabled" : ""}>−</button>
        <div class="stepper-val" id="alzas-val">${sinAbejas ? 0 : c.alzas}</div>
        <button type="button" id="alzas-mas" ${sinAbejas ? "disabled" : ""}>+</button>
      </div>
      ${sinAbejas ? `<div class="nota">🔒 Se bloquea en 0 porque la caja está "Sin abejas".</div>` : ""}
    </div>

    <div class="campo ${sinAbejas ? "bloqueado" : ""}">
      <label>¿Ya se meló?</label>
      <div class="seg">
        <button type="button" class="seg-btn ${c.melado === "Sí" ? "active" : ""}" data-melado="Sí" ${noPuedeMelar ? "disabled" : ""}>Sí</button>
        <button type="button" class="seg-btn ${c.melado !== "Sí" ? "active" : ""}" data-melado="No" ${sinAbejas ? "disabled" : ""}>No</button>
      </div>
      ${!sinAbejas && sinAlzas ? `<div class="nota">🔒 Para melar la caja tiene que tener al menos 1 alza.</div>` : ""}
    </div>

    <div class="campo ${mielBloqueada ? "bloqueado" : ""}">
      <label>Cantidad de miel (kg)</label>
      <input type="text" inputmode="decimal" id="f-miel" value="${mielBloqueada ? "0" : c.miel}" ${mielBloqueada ? "disabled" : ""}>
      ${mielBloqueada ? `<div class="nota">🔒 Se habilita al marcar "¿Ya se meló?" = Sí.</div>` : ""}
    </div>

    <div class="campo">
      <label>Fecha de última revisión</label>
      <input type="date" id="f-revision" value="${c.fechaRevision || ""}" max="${hoyISO()}">
    </div>

    <div class="campo">
      <label>📍 Ubicación de la colmena</label>
      <div class="gps-box">
        ${tieneGPS(c)
          ? `<div class="gps-coords">
               <div>Latitud: <b>${c.latitud.toFixed(6)}</b></div>
               <div>Longitud: <b>${c.longitud.toFixed(6)}</b></div>
               <div class="gps-fecha">Última ubicación registrada: ${fmtFechaHora(c.ubicacionFecha)}</div>
             </div>`
          : `<div class="gps-coords gps-vacia">Sin ubicación GPS</div>`}
        ${soloLectura ? "" : `<button type="button" id="btn-gps" class="btn-gps" ${gpsBuscando ? "disabled" : ""}>
          ${gpsBuscando ? "Obteniendo ubicación…" : tieneGPS(c) ? "📍 Actualizar ubicación" : "📍 Obtener ubicación"}
        </button>`}
        ${tieneGPS(c) ? `<button type="button" id="btn-ver-mapa" class="btn-mapa">🗺️ Ver en mapa</button>` : ""}
        ${gpsMsg ? `<div class="gps-msg ${gpsMsg.tipo}">${gpsMsg.texto}</div>` : ""}
      </div>
    </div>

    <div class="campo">
      <label>Observaciones</label>
      <textarea id="f-obs" placeholder="Reina nueva, colonia débil, se agregó alimento…">${c.observaciones || ""}</textarea>
    </div>

    ${puede("eliminar") ? `<div class="campo zona-eliminar">
      <button type="button" id="btn-eliminar" class="btn-eliminar">🗑️ Eliminar esta caja</button>
    </div>` : ""}
  `;

  if (!sinAbejas) {
    document.getElementById("alzas-menos").addEventListener("click", () => {
      editando.alzas = Math.max(0, (Number(editando.alzas) || 0) - 1);
      // Regla: sin alzas no se puede melar.
      if (editando.alzas < 1 && editando.melado === "Sí") {
        editando.melado = "No";
        editando.miel = 0;
      }
      renderEditor();
    });
    document.getElementById("alzas-mas").addEventListener("click", () => {
      editando.alzas = (Number(editando.alzas) || 0) + 1;
      renderEditor();
    });
  }

  document.querySelectorAll(".seg-btn").forEach((b) =>
    b.addEventListener("click", () => {
      if (sinAbejas) return;
      if (b.dataset.melado === "Sí" && sinAlzas) return;
      editando.melado = b.dataset.melado;
      if (editando.melado !== "Sí") editando.miel = 0;
      renderEditor();
    })
  );

  if (!mielBloqueada) {
    document.getElementById("f-miel").addEventListener("input", (e) => {
      const v = e.target.value.replace(",", ".");
      editando.miel = v === "" ? 0 : Number(v);
    });
  }
  const btnGps = document.getElementById("btn-gps");
  if (btnGps) btnGps.addEventListener("click", obtenerUbicacion);
  const btnEliminar = document.getElementById("btn-eliminar");
  if (btnEliminar) btnEliminar.addEventListener("click", eliminarDesdeEditor);
  const btnMapa = document.getElementById("btn-ver-mapa");
  if (btnMapa) {
    btnMapa.addEventListener("click", () => {
      const num = editando.num;
      cerrarEditor();
      mostrarVista("mapa", num);
    });
  }
  document.getElementById("f-revision").addEventListener("change", (e) => (editando.fechaRevision = e.target.value));
  document.getElementById("f-obs").addEventListener("input", (e) => (editando.observaciones = e.target.value));

  // SCRUM-49: con rol de solo lectura se puede mirar todo, pero no modificar nada.
  if (soloLectura) {
    document
      .querySelectorAll("#sheet-body input, #sheet-body textarea, #sheet-body .seg-btn, #alzas-menos, #alzas-mas")
      .forEach((el) => (el.disabled = true));
  }
}

function tieneGPS(c) {
  return c.latitud != null && c.longitud != null;
}

// SCRUM-18/19/20/22/23/24/25: obtener la ubicación solo cuando se toca el botón.
function obtenerUbicacion() {
  if (gpsBuscando || !editando || !puede("editar")) return;

  if (!("geolocation" in navigator)) {
    gpsMsg = { tipo: "error", texto: "Este navegador no permite obtener la ubicación. Probá con Chrome o Safari actualizado." };
    renderEditor();
    return;
  }
  if (!window.isSecureContext) {
    gpsMsg = { tipo: "error", texto: "La ubicación solo funciona en páginas seguras (https). Abrí la app desde su dirección publicada." };
    renderEditor();
    return;
  }

  const num = editando.num;
  gpsBuscando = true;
  gpsMsg = null;
  renderEditor();

  // El navegador pide permiso acá, recién al tocar el botón.
  navigator.geolocation.getCurrentPosition(
    async (pos) => {
      const lat = pos.coords.latitude;
      const lng = pos.coords.longitude;
      const fecha = new Date().toISOString();
      try {
        const guardada = await guardarUbicacion(num, lat, lng, fecha);
        const i = cajas.findIndex((x) => x.num === num);
        if (i !== -1) {
          cajas[i].latitud = guardada.latitud;
          cajas[i].longitud = guardada.longitud;
          cajas[i].ubicacionFecha = guardada.ubicacionFecha;
        }
        if (editando && editando.num === num) {
          editando.latitud = guardada.latitud;
          editando.longitud = guardada.longitud;
          editando.ubicacionFecha = guardada.ubicacionFecha;
          gpsMsg = { tipo: "ok", texto: `✅ Ubicación registrada correctamente (precisión aprox. ${Math.round(pos.coords.accuracy)} m).` };
        }
        renderLista();
      } catch (e) {
        console.error("No se pudo guardar la ubicación", e);
        const t = textoError(e, "Se obtuvo la ubicación pero no se pudo guardar. Revisá tu conexión e intentá de nuevo.");
        gpsMsg = t ? { tipo: "error", texto: t } : null;
      }
      gpsBuscando = false;
      if (editando) renderEditor();
    },
    (err) => {
      gpsBuscando = false;
      if (err.code === 1) {
        gpsMsg = { tipo: "error", texto: "Para registrar la ubicación tenés que permitir el acceso a la ubicación en tu navegador. Tocá el candado junto a la dirección, permití la ubicación y volvé a intentar." };
      } else if (err.code === 3) {
        gpsMsg = { tipo: "error", texto: "Tardó demasiado en obtener la ubicación. Revisá que el GPS esté activado y probá de nuevo, preferentemente al aire libre." };
      } else {
        gpsMsg = { tipo: "error", texto: "No se pudo determinar tu ubicación. Revisá que el GPS esté activado e intentá de nuevo." };
      }
      if (editando) renderEditor();
    },
    { enableHighAccuracy: true, timeout: 20000, maximumAge: 0 }
  );
}

// SCRUM-41: eliminar la caja abierta, con confirmación previa.
async function eliminarDesdeEditor() {
  const c = editando;
  if (!c || !puede("eliminar")) return;
  const confirmar = await confirmarModal(
    `Eliminar la Caja ${pad2(c.num)}`,
    "Se borran todos sus datos (estado, alzas, miel, revisión, ubicación GPS y observaciones). Esta acción no se puede deshacer.",
    "Eliminar",
    true
  );
  if (!confirmar) return;

  const btn = document.getElementById("btn-eliminar");
  btn.disabled = true;
  try {
    await eliminarCaja(c.num);
    const i = cajas.findIndex((x) => x.num === c.num);
    if (i !== -1) cajas.splice(i, 1);
    cerrarEditor();
    renderLista();
  } catch (err) {
    console.error("No se pudo eliminar la caja", err);
    avisarError(err, "No se pudo eliminar la caja. Revisá tu conexión e intentá de nuevo.");
    btn.disabled = false;
  }
}

async function guardarEditor() {
  const c = editando;
  if (!c || !puede("editar")) return;

  // Una caja sin abejas no tiene alzas ni miel.
  if (c.estado === "Sin abejas") {
    c.alzas = 0;
    c.melado = "No";
    c.miel = 0;
  }
  if (c.melado === "Sí" && (Number(c.alzas) || 0) < 1) {
    avisar("Una caja sin alzas no puede estar melada. Agregá al menos 1 alza o marcá \"No\" en \"¿Ya se meló?\".");
    return;
  }
  if (Number.isNaN(Number(c.miel)) || Number(c.miel) < 0) {
    avisar("La cantidad de miel tiene que ser un número válido (por ejemplo 2.5).");
    return;
  }

  const btn = document.getElementById("sheet-save");
  btn.disabled = true;
  try {
    const guardada = await guardarCaja(c);
    const i = cajas.findIndex((x) => x.num === guardada.num);
    if (i !== -1) cajas[i] = guardada;
    cerrarEditor();
    renderLista();
  } catch (e) {
    console.error("No se pudo guardar la caja", e);
    avisarError(e, "No se pudo guardar. Revisá tu conexión e intentá de nuevo.");
  } finally {
    btn.disabled = false;
  }
}

document.getElementById("sheet-close").addEventListener("click", cerrarEditor);
document.getElementById("sheet-cancel").addEventListener("click", cerrarEditor);
document.getElementById("backdrop").addEventListener("click", cerrarEditor);
document.getElementById("sheet-save").addEventListener("click", guardarEditor);
