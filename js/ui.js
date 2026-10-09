// js/ui.js
// SCRUM-10: listado de cajas con su estado.
// SCRUM-11: agregar una nueva caja.
// SCRUM-12: marcar una caja como "Con abejas" / "Sin abejas".

let cajas = [];
let busqueda = "";
let filtro = "todas";

function pad2(n) {
  return String(n).padStart(2, "0");
}

// SCRUM-17: coincide con el filtro de estado elegido.
function coincideFiltro(c) {
  if (filtro === "con") return c.estado === "Con abejas";
  if (filtro === "sin") return c.estado === "Sin abejas";
  return true;
}

// SCRUM-17: coincide con el texto buscado (número o ubicación).
function coincideBusqueda(c) {
  if (!busqueda) return true;
  const q = busqueda.toLowerCase();
  return (
    `caja ${pad2(c.num)}`.includes(q) ||
    String(c.num).includes(q) ||
    (c.ubicacion || "").toLowerCase().includes(q)
  );
}

function fmtFecha(iso) {
  if (!iso) return "—";
  const [y, m, d] = iso.split("-");
  return `${d}/${m}/${y}`;
}

// SCRUM-13/14/15/16: resumen de los datos de la caja dentro de la tarjeta.
function resumenCaja(c) {
  const melada = c.melado === "Sí"
    ? `<span class="pill pill-honey">Melada · ${Number(c.miel || 0).toFixed(1)} kg</span>`
    : "";
  const obs = c.observaciones
    ? `<div class="caja-obs">${c.observaciones.replace(/</g, "&lt;")}</div>`
    : "";
  return `
    ${melada}
    <div class="caja-datos">
      <span>Alzas: <b>${c.alzas || 0}</b></span>
      <span>Última revisión: <b>${fmtFecha(c.fechaRevision)}</b></span>
    </div>
    ${obs}`;
}

function badgeEstado(estado) {
  if (estado === "Con abejas") return `<span class="pill pill-on">Con abejas</span>`;
  if (estado === "Sin abejas") return `<span class="pill pill-off">Sin abejas</span>`;
  return `<span class="pill pill-none">Sin estado</span>`;
}

function renderLista() {
  const cont = document.getElementById("lista-cajas");
  if (!cajas.length) {
    cont.innerHTML = `<p class="muted">Todavía no hay cajas registradas. Agregá la primera con el botón "+".</p>`;
    return;
  }
  const visibles = cajas.filter((c) => coincideFiltro(c) && coincideBusqueda(c));
  if (!visibles.length) {
    cont.innerHTML = `<p class="muted">No hay cajas que coincidan con la búsqueda o el filtro.</p>`;
    return;
  }
  const ordenadas = [...visibles].sort((a, b) => a.num - b.num);
  cont.innerHTML = ordenadas
    .map(
      (c) => `
      <div class="caja-card" data-num="${c.num}">
        <div class="caja-num">Caja ${pad2(c.num)}</div>
        <div class="caja-info">
          ${badgeEstado(c.estado)}
          ${resumenCaja(c)}
        </div>
        <button class="btn-editar" data-num="${c.num}">Editar datos</button>
        <div class="caja-actions">
          <button class="btn-chip ${c.estado === "Con abejas" ? "active" : ""}" data-num="${c.num}" data-estado="Con abejas">Con abejas</button>
          <button class="btn-chip ${c.estado === "Sin abejas" ? "active" : ""}" data-num="${c.num}" data-estado="Sin abejas">Sin abejas</button>
        </div>
      </div>`
    )
    .join("");

  // Abrir el editor de la caja.
  cont.querySelectorAll(".btn-editar").forEach((btn) => {
    btn.addEventListener("click", () => {
      const caja = cajas.find((c) => c.num === Number(btn.dataset.num));
      if (caja) abrirEditor(caja);
    });
  });

  // SCRUM-12: marcar estado al tocar los chips.
  cont.querySelectorAll(".btn-chip").forEach((btn) => {
    btn.addEventListener("click", async () => {
      const num = Number(btn.dataset.num);
      const estado = btn.dataset.estado;
      const caja = cajas.find((c) => c.num === num);
      if (!caja || caja.estado === estado) return;
      caja.estado = estado;
      // Una caja sin abejas no tiene alzas ni miel.
      if (estado === "Sin abejas") {
        caja.alzas = 0;
        caja.melado = "No";
        caja.miel = 0;
      }
      btn.disabled = true;
      try {
        await guardarCaja(caja);
        renderLista();
      } catch (e) {
        console.error("No se pudo guardar el estado", e);
        alert("No se pudo guardar el cambio. Revisá tu conexión e intentá de nuevo.");
      }
    });
  });
}

// SCRUM-11: agregar una caja nueva con el siguiente número disponible.
async function agregarCaja() {
  const btn = document.getElementById("btn-agregar");
  btn.disabled = true;
  try {
    const num = proximoNumero(cajas);
    const nueva = blankCaja(num);
    const guardada = await guardarCaja(nueva);
    cajas.push(guardada);
    renderLista();
  } catch (e) {
    console.error("No se pudo agregar la caja", e);
    alert("No se pudo agregar la caja. Revisá tu conexión e intentá de nuevo.");
  } finally {
    btn.disabled = false;
  }
}

async function cargarListado() {
  const cont = document.getElementById("lista-cajas");
  cont.innerHTML = `<p class="muted">Cargando cajas…</p>`;
  try {
    cajas = await listarCajas();
    renderLista();
  } catch (e) {
    console.error("No se pudo cargar el listado", e);
    cont.innerHTML = `<p class="muted">No se pudo cargar el listado. Revisá tu conexión y recargá la página.</p>`;
  }
}