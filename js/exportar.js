// js/exportar.js
// SCRUM-54: descargar todas las cajas en un archivo que se abre con Excel (copia de respaldo).
//
// Formato: CSV con separador ";" y decimales con coma, que es lo que espera Excel en español.
// Empieza con una marca de codificación (BOM) para que se vean bien las tildes y la ñ, y con
// la línea "sep=;" para que Excel separe las columnas aunque su configuración regional sea otra.

function fechaCSV(iso) {
  if (!iso) return "";
  const [y, m, d] = String(iso).slice(0, 10).split("-");
  return `${d}/${m}/${y}`;
}

function fechaHoraCSV(iso) {
  if (!iso) return "";
  const f = new Date(iso);
  if (Number.isNaN(f.getTime())) return "";
  const dd = String(f.getDate()).padStart(2, "0");
  const mm = String(f.getMonth() + 1).padStart(2, "0");
  const hh = String(f.getHours()).padStart(2, "0");
  const mi = String(f.getMinutes()).padStart(2, "0");
  return `${dd}/${mm}/${f.getFullYear()} ${hh}:${mi}`;
}

function numeroCSV(n, decimales) {
  if (n === null || n === undefined || n === "") return "";
  const x = Number(n);
  if (Number.isNaN(x)) return "";
  return (decimales != null ? x.toFixed(decimales) : String(x)).replace(".", ",");
}

// Los textos que empiezan con = + - @ se podrían interpretar como fórmulas al abrirlos en
// Excel: se les antepone una comilla simple para que se vean como texto.
function textoSeguro(t) {
  const s = t == null ? "" : String(t);
  return /^[=+\-@\t\r]/.test(s) ? "'" + s : s;
}

function celdaCSV(valor) {
  let s = valor == null ? "" : String(valor);
  if (/[";\r\n]/.test(s)) s = '"' + s.replace(/"/g, '""') + '"';
  return s;
}

const COLUMNAS_EXPORTAR = [
  ["Caja", (c) => c.num],
  ["Estado", (c) => textoSeguro(c.estado)],
  ["Fecha de colocación", (c) => fechaCSV(c.fechaColocacion)],
  ["Fecha de ingreso de abejas", (c) => fechaCSV(c.fechaIngreso)],
  ["Alzas", (c) => c.alzas],
  ["¿Melada?", (c) => textoSeguro(c.melado)],
  ["Miel (kg)", (c) => numeroCSV(c.miel)],
  ["Última revisión", (c) => fechaCSV(c.fechaRevision)],
  ["Latitud", (c) => numeroCSV(c.latitud, 6)],
  ["Longitud", (c) => numeroCSV(c.longitud, 6)],
  ["Fecha de la ubicación", (c) => fechaHoraCSV(c.ubicacionFecha)],
  ["Observaciones", (c) => textoSeguro(c.observaciones)],
];

function generarCSV(lista) {
  const filas = [COLUMNAS_EXPORTAR.map(([titulo]) => celdaCSV(titulo)).join(";")];
  [...lista]
    .sort((a, b) => a.num - b.num)
    .forEach((c) => filas.push(COLUMNAS_EXPORTAR.map(([, f]) => celdaCSV(f(c))).join(";")));
  return "sep=;\r\n" + filas.join("\r\n") + "\r\n";
}

function descargarArchivo(nombre, contenido) {
  const blob = new Blob(["\uFEFF" + contenido], { type: "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = nombre;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

// Vuelve a pedir las cajas al servidor, para que la copia refleje lo que realmente está guardado.
async function exportarCajas() {
  if (!puede("exportar")) return;
  const btn = document.getElementById("btn-exportar");
  if (btn) btn.disabled = true;
  try {
    const todas = await listarCajas();
    descargarArchivo(`colmenapp_cajas_${hoyISO()}.csv`, generarCSV(todas));
    avisar(
      `Se descargó el archivo con ${todas.length} ${todas.length === 1 ? "caja" : "cajas"}. Lo vas a encontrar en la carpeta de descargas de tu dispositivo.`,
      "Copia lista"
    );
  } catch (e) {
    console.error("No se pudo exportar", e);
    avisarError(e, "No se pudo descargar la copia. Revisá tu conexión e intentá de nuevo.", "No se pudo exportar");
  } finally {
    if (btn) btn.disabled = false;
  }
}
