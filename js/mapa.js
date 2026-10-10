// js/mapa.js
// SCRUM-26: ver la ubicación de una caja en el mapa ("Ver en mapa").
// SCRUM-27: mapa general con todas las cajas que tienen coordenadas.
// SCRUM-28: cada caja es un marcador distinto (numerado).
// SCRUM-29: al tocar un marcador se ve el detalle de la caja.
// SCRUM-30: las cajas sin coordenadas se indican como "Sin ubicación GPS".
//
// Usa Leaflet + OpenStreetMap (gratis, sin clave).

let mapa = null;
let capaMarcadores = null;

function cajasConGPS() {
  return cajas.filter((c) => c.latitud != null && c.longitud != null);
}

function claseEstado(c) {
  if (c.estado === "Con abejas") return "con";
  if (c.estado === "Sin abejas") return "sin";
  return "nd";
}

// SCRUM-28: marcador numerado, con color según el estado de la caja.
function iconoCaja(c) {
  return L.divIcon({
    className: "",
    html: `<div class="marcador marcador-${claseEstado(c)}">${pad2(c.num)}</div>`,
    iconSize: [36, 36],
    iconAnchor: [18, 18],
    popupAnchor: [0, -20],
  });
}

// SCRUM-29: contenido que se muestra al seleccionar un marcador.
function popupCaja(c) {
  const estado = c.estado || "Sin estado";
  return `
    <div class="popup-caja">
      <div class="popup-titulo">Caja ${pad2(c.num)}</div>
      <div>Estado: <b>${estado}</b></div>
      <div>Alzas: <b>${c.alzas || 0}</b></div>
      <div>Última revisión: <b>${fmtFecha(c.fechaRevision)}</b></div>
      <div>📍 ${c.latitud.toFixed(6)}, ${c.longitud.toFixed(6)}</div>
    </div>`;
}

function renderSinGPS() {
  const cont = document.getElementById("mapa-sin-gps");
  const sin = cajas.filter((c) => !(c.latitud != null && c.longitud != null)).sort((a, b) => a.num - b.num);
  if (!sin.length) {
    cont.innerHTML = "";
    return;
  }
  cont.innerHTML = `
    <div class="sin-gps-titulo">Sin ubicación GPS (${sin.length})</div>
    <div class="sin-gps-lista">
      ${sin.map((c) => `<button class="chip-sin-gps" data-num="${c.num}">Caja ${pad2(c.num)}</button>`).join("")}
    </div>
    <div class="nota">Tocá una caja para abrirla y registrar su ubicación.</div>`;
  cont.querySelectorAll(".chip-sin-gps").forEach((b) =>
    b.addEventListener("click", () => {
      const caja = cajas.find((c) => c.num === Number(b.dataset.num));
      if (caja) abrirEditor(caja);
    })
  );
}

function renderMapa(focusNum) {
  const aviso = document.getElementById("mapa-aviso");
  aviso.textContent = "";

  if (typeof L === "undefined") {
    aviso.textContent = "No se pudo cargar el mapa. Revisá tu conexión a internet y recargá la página.";
    renderSinGPS();
    return;
  }

  if (!mapa) {
    // Vista inicial: Paraguay, hasta que haya cajas con ubicación.
    mapa = L.map("mapa").setView([-25.3, -57.6], 6);
    // Capa satelital (Esri World Imagery) y capa de calles (OpenStreetMap).
    const satelite = L.tileLayer(
      "https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}",
      {
        maxZoom: 19,
        maxNativeZoom: 18,
        attribution: "Imágenes &copy; Esri, Maxar, Earthstar Geographics y la comunidad de usuarios GIS",
      }
    );
    const calles = L.tileLayer("https://tile.openstreetmap.org/{z}/{x}/{y}.png", {
      maxZoom: 19,
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
    });
    satelite.addTo(mapa); // por defecto: satélite
    L.control.layers({ "Satélite": satelite, "Calles": calles }, null, { position: "topright" }).addTo(mapa);
    capaMarcadores = L.layerGroup().addTo(mapa);
  }

  // El mapa estaba oculto: hay que avisarle su tamaño real.
  mapa.invalidateSize();
  capaMarcadores.clearLayers();

  const conGPS = cajasConGPS();
  let marcadorFoco = null;

  conGPS.forEach((c) => {
    const m = L.marker([c.latitud, c.longitud], { icon: iconoCaja(c) }).bindPopup(popupCaja(c));
    m.addTo(capaMarcadores);
    if (c.num === focusNum) marcadorFoco = m;
  });

  if (marcadorFoco) {
    mapa.setView(marcadorFoco.getLatLng(), 17);
    marcadorFoco.openPopup();
  } else if (conGPS.length) {
    const limites = L.latLngBounds(conGPS.map((c) => [c.latitud, c.longitud]));
    mapa.fitBounds(limites, { padding: [40, 40], maxZoom: 17 });
  } else {
    aviso.textContent = "Todavía ninguna caja tiene ubicación GPS registrada.";
  }

  renderSinGPS();
}

// Cambiar entre la lista de cajas y el mapa.
function mostrarVista(vista, focusNum) {
  document.getElementById("view-cajas").style.display = vista === "cajas" ? "" : "none";
  document.getElementById("view-mapa").style.display = vista === "mapa" ? "" : "none";
  document.getElementById("btn-agregar").style.display = vista === "cajas" ? "" : "none";
  document.querySelectorAll(".tab").forEach((t) => t.classList.toggle("active", t.dataset.vista === vista));
  if (vista === "mapa") renderMapa(focusNum);
}

document.querySelectorAll(".tab").forEach((t) =>
  t.addEventListener("click", () => mostrarVista(t.dataset.vista))
);
